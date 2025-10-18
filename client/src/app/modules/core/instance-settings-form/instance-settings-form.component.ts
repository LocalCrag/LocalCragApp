import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { EditorModule } from 'primeng/editor';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { InstanceSettings } from '../../../models/instance-settings';
import { InstanceSettingsService } from '../../../services/crud/instance-settings.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { updateInstanceSettings } from '../../../ngrx/actions/instance-settings.actions';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DividerModule } from 'primeng/divider';
import { getRgbObject } from '../../../utility/misc/color';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Select } from 'primeng/select';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { StartingPosition } from '../../../enums/starting-position';

@Component({
  selector: 'lc-instance-settings-form',
  imports: [
    ButtonModule,
    CardModule,
    ConfirmPopupModule,
    EditorModule,
    InputTextModule,
    PaginatorModule,
    ReactiveFormsModule,
    TranslocoDirective,
    ColorPickerModule,
    DividerModule,
    PasswordModule,
    DividerModule,
    TooltipModule,
    ToggleSwitch,
    Select,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    SingleImageUploadComponent,
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

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private router: Router,
    private instanceSettingsService: InstanceSettingsService,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit() {
    this.buildForm();
    // build translated options for starting positions
    this.startingPositionsOptions = this.startingPositions.map((sp) => ({
      label: this.translocoService.translate(sp),
      value: sp,
    }));

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
          }
          return of(e);
        }),
      )
      .subscribe((instanceSettings) => {
        this.instanceSettings = instanceSettings;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
      });
  }

  private buildForm() {
    this.instanceSettingsForm = this.fb.group({
      instanceName: [null, [Validators.required, Validators.maxLength(120)]],
      copyrightOwner: [null, [Validators.required, Validators.maxLength(120)]],
      gymMode: [null],
      skippedHierarchicalLayers: [null],
      displayUserGrades: [null],
      displayUserRatings: [null],
      disableFAInAscents: [null],
      logoImage: [null],
      faviconImage: [null],
      authBgImage: [null],
      mainBgImage: [null],
      arrowColor: [null],
      arrowTextColor: [null],
      arrowHighlightColor: [null],
      arrowHighlightTextColor: [null],
      barChartColor: [null],
      matomoTrackerUrl: [null],
      matomoSiteId: [null],
      maptilerApiKey: [null],
      faDefaultFormat: [null],
      defaultStartingPosition: [null, [Validators.required]],
      rankingPastWeeks: [null],
    });
  }

  private setFormValue() {
    this.instanceSettingsForm.enable();
    this.instanceSettingsForm.patchValue({
      instanceName: this.instanceSettings.instanceName,
      copyrightOwner: this.instanceSettings.copyrightOwner,
      gymMode: this.instanceSettings.gymMode,
      skippedHierarchicalLayers:
        this.instanceSettings.skippedHierarchicalLayers,
      displayUserGrades: this.instanceSettings.displayUserGrades,
      displayUserRatings: this.instanceSettings.displayUserRatings,
      disableFAInAscents: this.instanceSettings.disableFAInAscents,
      logoImage: this.instanceSettings.logoImage,
      faviconImage: this.instanceSettings.faviconImage,
      authBgImage: this.instanceSettings.authBgImage,
      mainBgImage: this.instanceSettings.mainBgImage,
      arrowColor: this.instanceSettings.arrowColor,
      arrowTextColor: this.instanceSettings.arrowTextColor,
      arrowHighlightColor: this.instanceSettings.arrowHighlightColor,
      arrowHighlightTextColor: this.instanceSettings.arrowHighlightTextColor,
      barChartColor: getRgbObject(this.instanceSettings.barChartColor),
      matomoSiteId: this.instanceSettings.matomoSiteId,
      matomoTrackerUrl: this.instanceSettings.matomoTrackerUrl,
      maptilerApiKey: this.instanceSettings.maptilerApiKey,
      faDefaultFormat: this.instanceSettings.faDefaultFormat,
      defaultStartingPosition: this.instanceSettings.defaultStartingPosition,
      rankingPastWeeks: this.instanceSettings.rankingPastWeeks,
    });
  }

  public saveInstanceSettings() {
    if (this.instanceSettingsForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const instanceSettings = new InstanceSettings();
      instanceSettings.instanceName =
        this.instanceSettingsForm.get('instanceName').value;
      instanceSettings.copyrightOwner =
        this.instanceSettingsForm.get('copyrightOwner').value;
      instanceSettings.gymMode = this.instanceSettingsForm.get('gymMode').value;
      instanceSettings.skippedHierarchicalLayers =
        this.instanceSettingsForm.get('skippedHierarchicalLayers').value;
      instanceSettings.displayUserGrades =
        this.instanceSettingsForm.get('displayUserGrades').value;
      instanceSettings.displayUserRatings =
        this.instanceSettingsForm.get('displayUserRatings').value;
      instanceSettings.disableFAInAscents =
        this.instanceSettingsForm.get('disableFAInAscents').value;
      instanceSettings.logoImage =
        this.instanceSettingsForm.get('logoImage').value;
      instanceSettings.faviconImage =
        this.instanceSettingsForm.get('faviconImage').value;
      instanceSettings.mainBgImage =
        this.instanceSettingsForm.get('mainBgImage').value;
      instanceSettings.authBgImage =
        this.instanceSettingsForm.get('authBgImage').value;
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
      instanceSettings.matomoSiteId =
        this.instanceSettingsForm.get('matomoSiteId').value;
      instanceSettings.matomoTrackerUrl =
        this.instanceSettingsForm.get('matomoTrackerUrl').value;
      instanceSettings.maptilerApiKey =
        this.instanceSettingsForm.get('maptilerApiKey').value;
      instanceSettings.faDefaultFormat =
        this.instanceSettingsForm.get('faDefaultFormat').value;
      instanceSettings.defaultStartingPosition = this.instanceSettingsForm.get(
        'defaultStartingPosition',
      ).value;
      instanceSettings.rankingPastWeeks =
        this.instanceSettingsForm.get('rankingPastWeeks').value;
      this.instanceSettingsService
        .updateInstanceSettings(instanceSettings)
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
