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
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError, switchMap } from 'rxjs/operators';
import { EMPTY, of, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import {
  InstanceSettings,
  type InstanceSettingsPatch,
} from '../../../models/instance-settings';
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
import { TooltipModule } from 'primeng/tooltip';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { PageTitleService } from '../../../services/core/page-title.service';
import { InstanceSettingsGeneralTabComponent } from './instance-settings-general-tab.component';
import { InstanceSettingsAppearanceTabComponent } from './instance-settings-appearance-tab.component';
import { InstanceSettingsAnalyticsTabComponent } from './instance-settings-analytics-tab.component';
import { InstanceSettingsMapsTabComponent } from './instance-settings-maps-tab.component';
import { createGeneralFormGroup } from './instance-settings-general-form';
import {
  createMapsFormGroup,
  populateMapsFormGroup,
  serializeMapsFormGroup,
} from './instance-settings-maps-form';

type SettingsTabId = 'general' | 'appearance' | 'analytics' | 'maps';

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
    ColorPickerModule,
    DividerModule,
    TooltipModule,
    Tabs,
    TabList,
    Tab,
    FormDirective,
    InstanceSettingsGeneralTabComponent,
    InstanceSettingsAppearanceTabComponent,
    InstanceSettingsAnalyticsTabComponent,
    InstanceSettingsMapsTabComponent,
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
  public activeTab: SettingsTabId = 'general';
  public saveGeneralTab = () => this.saveTab('general');
  public saveAppearanceTab = () => this.saveTab('appearance');
  public saveAnalyticsTab = () => this.saveTab('analytics');
  public saveMapsTab = () => this.saveTab('maps');

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

  mapsGroup(): FormGroup {
    return this.instanceSettingsForm.get('maps') as FormGroup;
  }

  generalGroup(): FormGroup {
    return this.instanceSettingsForm.get('general') as FormGroup;
  }

  appearanceGroup(): FormGroup {
    return this.instanceSettingsForm.get('appearance') as FormGroup;
  }

  analyticsGroup(): FormGroup {
    return this.instanceSettingsForm.get('analytics') as FormGroup;
  }

  private buildForm() {
    this.instanceSettingsForm = this.fb.group({
      general: createGeneralFormGroup(this.fb),
      appearance: this.fb.group({
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
      }),
      analytics: this.fb.group({
        matomoTrackerUrl: [null, [Validators.maxLength(120)]],
        matomoSiteId: [null, [Validators.maxLength(120)]],
      }),
      maps: createMapsFormGroup(this.fb),
    });
  }

  private setFormValue() {
    this.instanceSettingsForm.enable();
    populateMapsFormGroup(this.fb, this.mapsGroup(), this.instanceSettings);
    this.instanceSettingsForm.patchValue({
      general: {
        instanceName: this.instanceSettings.instanceName,
        copyrightOwner: this.instanceSettings.copyrightOwner,
        mailGreeting: this.instanceSettings.mailGreeting,
        gymMode: this.instanceSettings.gymMode,
        skippedHierarchicalLayers:
          this.instanceSettings.skippedHierarchicalLayers,
        displayUserGrades: this.instanceSettings.displayUserGrades,
        displayUserRatings: this.instanceSettings.displayUserRatings,
        faDefaultFormat: this.instanceSettings.faDefaultFormat,
        defaultStartingPosition: this.instanceSettings.defaultStartingPosition,
        rankingPastWeeks: this.instanceSettings.rankingPastWeeks,
        language: this.instanceSettings.language,
        timezone: this.instanceSettings.timezone,
      },
      appearance: {
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
        darkBarChartColor: getRgbObject(
          this.instanceSettings.darkBarChartColor,
        ),
        darkBarChartAccentColor: getRgbObject(
          this.instanceSettings.darkBarChartAccentColor,
        ),
      },
      analytics: {
        matomoSiteId: this.instanceSettings.matomoSiteId,
        matomoTrackerUrl: this.instanceSettings.matomoTrackerUrl,
      },
    });
  }

  public saveTab(tab: SettingsTabId) {
    const group = this.instanceSettingsForm.get(tab) as FormGroup | null;
    if (!group) {
      return;
    }
    if (!group.valid) {
      group.markAllAsTouched();
      return;
    }

    this.loadingState = LoadingState.LOADING;
    const patch = this.buildPatchForTab(tab);
    const appearance = this.appearanceGroup().getRawValue();
    const preflight$ =
      tab === 'appearance'
        ? this.uploadService.saveFileFocusIfChanged(appearance.bgImage)
        : of(null);

    preflight$
      .pipe(
        switchMap(() =>
          this.instanceSettingsService.patchInstanceSettings(patch),
        ),
      )
      .subscribe({
        next: (instanceSettings) => {
          this.store.dispatch(toastNotification('INSTANCE_SETTINGS_UPDATED'));
          this.loadingState = LoadingState.DEFAULT;
          this.instanceSettings = instanceSettings;
          this.setFormValue();
          this.store.dispatch(
            updateInstanceSettings({ settings: instanceSettings }),
          );
        },
        error: (e) => {
          this.loadingState = LoadingState.DEFAULT;
          if (e.error?.message == 'MIGRATION_IMPOSSIBLE') {
            this.store.dispatch(
              toastNotification('INSTANCE_SETTINGS_ERROR_MIGRATION_IMPOSSIBLE'),
            );
          } else {
            this.store.dispatch(toastNotification('UNKNOWN_ERROR'));
          }
        },
      });
  }

  private buildPatchForTab(tab: SettingsTabId): InstanceSettingsPatch {
    if (tab === 'general') {
      return InstanceSettings.serializeGeneralPatch(
        this.generalGroup().getRawValue(),
      );
    }
    if (tab === 'appearance') {
      const raw = this.appearanceGroup().getRawValue();
      return InstanceSettings.serializeAppearancePatch({
        ...raw,
        barChartColor: this.getCSSRgbValue(raw.barChartColor),
        barChartAccentColor: this.getCSSRgbValue(raw.barChartAccentColor),
        darkBarChartColor: this.getCSSRgbValue(raw.darkBarChartColor),
        darkBarChartAccentColor: this.getCSSRgbValue(
          raw.darkBarChartAccentColor,
        ),
      });
    }
    if (tab === 'analytics') {
      return InstanceSettings.serializeAnalyticsPatch(
        this.analyticsGroup().getRawValue(),
      );
    }
    return InstanceSettings.serializeMapsPatch(
      serializeMapsFormGroup(this.mapsGroup()),
    );
  }

  private getCSSRgbValue(raw: any): string {
    return `rgb(${raw.r}, ${raw.g}, ${raw.b})`;
  }
}
