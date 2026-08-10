import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { EditorModule } from 'primeng/editor';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError, switchMap } from 'rxjs/operators';
import { EMPTY, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { InstanceSettings } from '../../../models/instance-settings';
import {
  RockExplorerMapLayer,
  RockExplorerMapLayerSourceKind,
  RockExplorerMapLayerTileSize,
} from '../../../models/rock-explorer-map-layer';
import { InstanceSettingsService } from '../../../services/crud/instance-settings.service';
import { UploadService } from '../../../services/crud/upload.service';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PaginatorModule } from 'primeng/paginator';
import { updateInstanceSettings } from '../../../ngrx/actions/instance-settings.actions';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DividerModule } from 'primeng/divider';
import { getRgbObject } from '../../../utility/misc/color';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Checkbox } from 'primeng/checkbox';
import { Select } from 'primeng/select';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { StartingPosition } from '../../../enums/starting-position';
import { LanguageSelectComponent } from '../../shared/forms/controls/language-select/language-select.component';
import { getInstanceTimezoneOptions } from '../../../utility/constants/instance-timezones';
import { PageTitleService } from '../../../services/core/page-title.service';
import { httpUrlValidator } from '../../../utility/validators/http-url.validator';
import { FormEntryRowComponent } from '../../shared/components/form-entry-row/form-entry-row.component';

const tilesUrlTemplateValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const sourceKind = group.get('sourceKind')?.value;
  const url = group.get('url')?.value as string | null;
  if (sourceKind !== 'tiles' || !url) {
    return null;
  }
  if (!url.includes('{z}') || !url.includes('{x}') || !url.includes('{y}')) {
    return { tilesUrlMissingPlaceholders: true };
  }
  return null;
};

@Component({
  selector: 'lc-instance-settings-form',
  imports: [
    ButtonModule,
    ConfirmPopupModule,
    EditorModule,
    InputTextModule,
    InputNumberModule,
    PaginatorModule,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ColorPickerModule,
    DividerModule,
    PasswordModule,
    DividerModule,
    TooltipModule,
    ToggleSwitch,
    Checkbox,
    Select,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    SingleImageUploadComponent,
    LanguageSelectComponent,
    FormEntryRowComponent,
  ],
  templateUrl: './instance-settings-form.component.html',
  styleUrl: './instance-settings-form.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class InstanceSettingsFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public instanceSettingsForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public instanceSettings: InstanceSettings;
  public faDefaultFormats = FaDefaultFormat;
  public startingPositions = [
    StartingPosition.STAND,
    StartingPosition.SIT,
    StartingPosition.CROUCH,
    StartingPosition.LAYDOWN,
    StartingPosition.FRENCH,
    StartingPosition.CANDLE,
  ];
  public startingPositionsOptions: {
    label: string;
    value: StartingPosition;
  }[] = [];
  public rankingPastWeeksOptions: { label: string; value: number | null }[] =
    [];
  public timezoneOptions = getInstanceTimezoneOptions();
  public sourceKindOptions: {
    label: string;
    value: RockExplorerMapLayerSourceKind;
  }[] = [];
  public tileSizeOptions: {
    label: string;
    value: RockExplorerMapLayerTileSize;
  }[] = [
    { label: '256', value: 256 },
    { label: '512', value: 512 },
  ];
  public readonly maxMapLayers = 10;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private instanceSettingsService = inject(InstanceSettingsService);
  private uploadService = inject(UploadService);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        marker('instanceSettings.instanceSettingsForm.editInstanceSettings'),
      ),
    );
    this.buildForm();
    // build translated options for starting positions
    this.startingPositionsOptions = this.startingPositions.map((sp) => ({
      label: this.translocoService.translate(sp),
      value: sp,
    }));
    this.sourceKindOptions = [
      {
        label: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerSourceKindTilejson',
          ),
        ),
        value: 'tilejson',
      },
      {
        label: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerSourceKindTiles',
          ),
        ),
        value: 'tiles',
      },
    ];

    // build options for rankingPastWeeks
    this.rankingPastWeeksOptions = [
      {
        label: this.translocoService.translate(
          'instanceSettings.instanceSettingsForm.rankingPastWeeksAll',
        ),
        value: null,
      },
      ...Array.from({ length: 20 }, (_, i) => i + 1).map((w) => ({
        label:
          w === 1
            ? this.translocoService.translate(
                'instanceSettings.instanceSettingsForm.rankingPastWeeksWeek',
              )
            : this.translocoService.translate(
                'instanceSettings.instanceSettingsForm.rankingPastWeeksWeeks',
                { weeks: w },
              ),
        value: w,
      })),
    ];

    this.instanceSettingsForm.disable();
    this.instanceSettingsService
      .getInstanceSettings()
      .pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
            return EMPTY;
          }
          return throwError(() => e);
        }),
      )
      .subscribe((instanceSettings) => {
        this.instanceSettings = instanceSettings;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
      });
  }

  rockExplorerMapLayersControls(): FormArray {
    return this.instanceSettingsForm.get('rockExplorerMapLayers') as FormArray;
  }

  private createMapLayerGroup(
    layer?: Partial<RockExplorerMapLayer>,
  ): FormGroup {
    return this.fb.group(
      {
        id: [layer?.id ?? crypto.randomUUID()],
        name: [
          layer?.name ?? '',
          [Validators.required, Validators.maxLength(120)],
        ],
        sourceKind: [layer?.sourceKind ?? 'tilejson', [Validators.required]],
        url: [
          layer?.url ?? '',
          [Validators.required, Validators.maxLength(2048), httpUrlValidator()],
        ],
        type: [{ value: 'raster', disabled: true }],
        opacity: [
          layer?.opacity ?? 0.5,
          [Validators.required, Validators.min(0), Validators.max(1)],
        ],
        tileSize: [layer?.tileSize ?? 256, [Validators.required]],
        defaultOn: [layer?.defaultOn !== false],
      },
      { validators: [tilesUrlTemplateValidator] },
    );
  }

  addMapLayer(): void {
    if (this.rockExplorerMapLayersControls().length >= this.maxMapLayers) {
      return;
    }
    this.rockExplorerMapLayersControls().push(this.createMapLayerGroup());
  }

  removeMapLayer(index: number): void {
    this.rockExplorerMapLayersControls().removeAt(index);
  }

  moveMapLayer(index: number, direction: 'up' | 'down'): void {
    const layers = this.rockExplorerMapLayersControls();
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= layers.length) {
      return;
    }
    const control = layers.at(index);
    layers.removeAt(index);
    layers.insert(target, control);
  }

  private buildForm() {
    this.instanceSettingsForm = this.fb.group({
      instanceName: [null, [Validators.required, Validators.maxLength(120)]],
      copyrightOwner: [null, [Validators.required, Validators.maxLength(120)]],
      mailGreeting: [null, [Validators.required, Validators.maxLength(120)]],
      gymMode: [null],
      skippedHierarchicalLayers: [null],
      displayUserGrades: [null],
      displayUserRatings: [null],
      logoImage: [null],
      darkLogoImage: [null],
      faviconImage: [null],
      bgImage: [null],
      arrowColor: [null],
      arrowTextColor: [null],
      arrowHighlightColor: [null],
      arrowHighlightTextColor: [null],
      barChartColor: [null],
      barChartAccentColor: [null],
      darkBarChartColor: [null],
      darkBarChartAccentColor: [null],
      matomoTrackerUrl: [null, [Validators.maxLength(120)]],
      matomoSiteId: [null, [Validators.maxLength(120)]],
      maptilerApiKey: [null, [Validators.maxLength(120)]],
      rockExplorerMapLayers: this.fb.array([]),
      faDefaultFormat: [null],
      defaultStartingPosition: [null, [Validators.required]],
      rankingPastWeeks: [null],
      language: [null],
      timezone: [null, [Validators.required]],
    });
  }

  private setFormValue() {
    this.instanceSettingsForm.enable();
    const layersArray = this.rockExplorerMapLayersControls();
    layersArray.clear();
    (this.instanceSettings.rockExplorerMapLayers ?? []).forEach((layer) => {
      layersArray.push(this.createMapLayerGroup(layer));
    });
    this.instanceSettingsForm.patchValue({
      instanceName: this.instanceSettings.instanceName,
      copyrightOwner: this.instanceSettings.copyrightOwner,
      mailGreeting: this.instanceSettings.mailGreeting,
      gymMode: this.instanceSettings.gymMode,
      skippedHierarchicalLayers:
        this.instanceSettings.skippedHierarchicalLayers,
      displayUserGrades: this.instanceSettings.displayUserGrades,
      displayUserRatings: this.instanceSettings.displayUserRatings,
      logoImage: this.instanceSettings.logoImage,
      darkLogoImage: this.instanceSettings.darkLogoImage,
      faviconImage: this.instanceSettings.faviconImage,
      bgImage: this.instanceSettings.bgImage,
      arrowColor: this.instanceSettings.arrowColor,
      arrowTextColor: this.instanceSettings.arrowTextColor,
      arrowHighlightColor: this.instanceSettings.arrowHighlightColor,
      arrowHighlightTextColor: this.instanceSettings.arrowHighlightTextColor,
      barChartColor: getRgbObject(this.instanceSettings.barChartColor),
      barChartAccentColor: getRgbObject(
        this.instanceSettings.barChartAccentColor,
      ),
      darkBarChartColor: getRgbObject(this.instanceSettings.darkBarChartColor),
      darkBarChartAccentColor: getRgbObject(
        this.instanceSettings.darkBarChartAccentColor,
      ),
      matomoSiteId: this.instanceSettings.matomoSiteId,
      matomoTrackerUrl: this.instanceSettings.matomoTrackerUrl,
      maptilerApiKey: this.instanceSettings.maptilerApiKey,
      faDefaultFormat: this.instanceSettings.faDefaultFormat,
      defaultStartingPosition: this.instanceSettings.defaultStartingPosition,
      rankingPastWeeks: this.instanceSettings.rankingPastWeeks,
      language: this.instanceSettings.language,
      timezone: this.instanceSettings.timezone,
    });
    // Keep type fixed to raster (form.enable() would otherwise unlock it).
    for (const group of layersArray.controls) {
      group.get('type')?.disable({ emitEvent: false });
    }
  }

  public saveInstanceSettings() {
    if (this.instanceSettingsForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const instanceSettings = new InstanceSettings();
      instanceSettings.instanceName =
        this.instanceSettingsForm.get('instanceName').value;
      instanceSettings.copyrightOwner =
        this.instanceSettingsForm.get('copyrightOwner').value;
      instanceSettings.mailGreeting =
        this.instanceSettingsForm.get('mailGreeting').value;
      instanceSettings.gymMode = this.instanceSettingsForm.get('gymMode').value;
      instanceSettings.skippedHierarchicalLayers =
        this.instanceSettingsForm.get('skippedHierarchicalLayers').value;
      instanceSettings.displayUserGrades =
        this.instanceSettingsForm.get('displayUserGrades').value;
      instanceSettings.displayUserRatings =
        this.instanceSettingsForm.get('displayUserRatings').value;
      instanceSettings.logoImage =
        this.instanceSettingsForm.get('logoImage').value;
      instanceSettings.darkLogoImage =
        this.instanceSettingsForm.get('darkLogoImage').value;
      instanceSettings.faviconImage =
        this.instanceSettingsForm.get('faviconImage').value;
      instanceSettings.bgImage = this.instanceSettingsForm.get('bgImage').value;
      instanceSettings.arrowColor =
        this.instanceSettingsForm.get('arrowColor').value;
      instanceSettings.arrowTextColor =
        this.instanceSettingsForm.get('arrowTextColor').value;
      instanceSettings.arrowHighlightColor = this.instanceSettingsForm.get(
        'arrowHighlightColor',
      ).value;
      instanceSettings.arrowHighlightTextColor = this.instanceSettingsForm.get(
        'arrowHighlightTextColor',
      ).value;
      instanceSettings.barChartColor = this.getCSSRgbValue(
        this.instanceSettingsForm.get('barChartColor').value,
      );
      instanceSettings.barChartAccentColor = this.getCSSRgbValue(
        this.instanceSettingsForm.get('barChartAccentColor').value,
      );
      instanceSettings.darkBarChartColor = this.getCSSRgbValue(
        this.instanceSettingsForm.get('darkBarChartColor').value,
      );
      instanceSettings.darkBarChartAccentColor = this.getCSSRgbValue(
        this.instanceSettingsForm.get('darkBarChartAccentColor').value,
      );
      instanceSettings.matomoSiteId =
        this.instanceSettingsForm.get('matomoSiteId').value;
      instanceSettings.matomoTrackerUrl =
        this.instanceSettingsForm.get('matomoTrackerUrl').value;
      instanceSettings.maptilerApiKey =
        this.instanceSettingsForm.get('maptilerApiKey').value;
      instanceSettings.rockExplorerMapLayers = (
        this.rockExplorerMapLayersControls().getRawValue() ?? []
      ).map((layer) =>
        RockExplorerMapLayer.deserialize({
          ...layer,
          type: 'raster',
        }),
      );
      instanceSettings.faDefaultFormat =
        this.instanceSettingsForm.get('faDefaultFormat').value;
      instanceSettings.defaultStartingPosition = this.instanceSettingsForm.get(
        'defaultStartingPosition',
      ).value;
      instanceSettings.rankingPastWeeks =
        this.instanceSettingsForm.get('rankingPastWeeks').value;
      instanceSettings.language =
        this.instanceSettingsForm.get('language').value;
      instanceSettings.timezone =
        this.instanceSettingsForm.get('timezone').value;
      this.uploadService
        .saveFileFocusIfChanged(instanceSettings.bgImage)
        .pipe(
          switchMap(() =>
            this.instanceSettingsService.updateInstanceSettings(
              instanceSettings,
            ),
          ),
        )
        .subscribe({
          next: (instanceSettings) => {
            this.store.dispatch(toastNotification('INSTANCE_SETTINGS_UPDATED'));
            this.loadingState = LoadingState.DEFAULT;
            this.store.dispatch(
              updateInstanceSettings({ settings: instanceSettings }),
            );
          },
          error: (e) => {
            this.loadingState = LoadingState.DEFAULT;
            if (e.error?.message == 'MIGRATION_IMPOSSIBLE') {
              this.store.dispatch(
                toastNotification(
                  'INSTANCE_SETTINGS_ERROR_MIGRATION_IMPOSSIBLE',
                ),
              );
            } else {
              this.store.dispatch(toastNotification('UNKNOWN_ERROR'));
            }
          },
        });
    } else {
      this.formDirective.markAsTouched();
    }
  }

  private getCSSRgbValue(raw: any): string {
    return `rgb(${raw.r}, ${raw.g}, ${raw.b})`;
  }
}
