import {Component, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {Editor, EditorModule} from 'primeng/editor';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {UploadService} from '../../../services/crud/upload.service';
import {Title} from '@angular/platform-browser';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {InstanceSettings} from '../../../models/instance-settings';
import {InstanceSettingsService} from '../../../services/crud/instance-settings.service';
import {httpUrlValidator} from '../../../utility/validators/http-url.validator';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {GpsComponent} from '../../shared/forms/controls/gps/gps.component';
import {InputTextModule} from 'primeng/inputtext';
import {NgIf} from '@angular/common';
import {PaginatorModule} from 'primeng/paginator';
import {SharedModule} from '../../shared/shared.module';
import {updateInstanceSettings} from '../../../ngrx/actions/instance-settings.actions';
import {ColorPickerModule} from 'primeng/colorpicker';
import {DividerModule} from 'primeng/divider';
import {getRgbObject} from '../../../utility/misc/color';

@Component({
  selector: 'lc-instance-settings-form',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    ConfirmPopupModule,
    EditorModule,
    GpsComponent,
    InputTextModule,
    NgIf,
    PaginatorModule,
    ReactiveFormsModule,
    SharedModule,
    SharedModule,
    TranslocoDirective,
    ColorPickerModule,
    DividerModule
  ],
  templateUrl: './instance-settings-form.component.html',
  styleUrl: './instance-settings-form.component.scss'
})
export class InstanceSettingsFormComponent {

  @ViewChild(FormDirective) formDirective: FormDirective;

  public instanceSettingsForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public instanceSettings: InstanceSettings;

  constructor(private fb: FormBuilder,
              private store: Store,
              private router: Router,
              private instanceSettingsService: InstanceSettingsService) {
  }

  ngOnInit() {
    this.buildForm();
    this.instanceSettingsForm.disable();
    this.instanceSettingsService.getInstanceSettings().pipe(catchError(e => {
      if (e.status === 404) {
        this.router.navigate(['/not-found']);
      }
      return of(e);
    })).subscribe(instanceSettings => {
      this.instanceSettings = instanceSettings;
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  private buildForm() {
    this.instanceSettingsForm = this.fb.group({
      instanceName: [null, [Validators.required, Validators.maxLength(120)]],
      copyrightOwner: [null, [Validators.required, Validators.maxLength(120)]],
      youtubeUrl: [null, [httpUrlValidator(), Validators.maxLength(120)]],
      instagramUrl: [null, [httpUrlValidator(), Validators.maxLength(120)]],
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
    });
  }

  private setFormValue() {
    this.instanceSettingsForm.enable();
    this.instanceSettingsForm.patchValue({
      instanceName: this.instanceSettings.instanceName,
      copyrightOwner: this.instanceSettings.copyrightOwner,
      youtubeUrl: this.instanceSettings.youtubeUrl,
      instagramUrl: this.instanceSettings.instagramUrl,
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
    });
  }

  public saveInstanceSettings() {
    if (this.instanceSettingsForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const instanceSettings = new InstanceSettings();
      instanceSettings.instanceName = this.instanceSettingsForm.get('instanceName').value;
      instanceSettings.copyrightOwner = this.instanceSettingsForm.get('copyrightOwner').value;
      instanceSettings.youtubeUrl = this.instanceSettingsForm.get('youtubeUrl').value;
      instanceSettings.instagramUrl = this.instanceSettingsForm.get('instagramUrl').value;
      instanceSettings.logoImage = this.instanceSettingsForm.get('logoImage').value;
      instanceSettings.faviconImage = this.instanceSettingsForm.get('faviconImage').value;
      instanceSettings.mainBgImage = this.instanceSettingsForm.get('mainBgImage').value;
      instanceSettings.authBgImage = this.instanceSettingsForm.get('authBgImage').value;
      instanceSettings.arrowColor = this.instanceSettingsForm.get('arrowColor').value;
      instanceSettings.arrowTextColor = this.instanceSettingsForm.get('arrowTextColor').value;
      instanceSettings.arrowHighlightColor = this.instanceSettingsForm.get('arrowHighlightColor').value;
      instanceSettings.arrowHighlightTextColor = this.instanceSettingsForm.get('arrowHighlightTextColor').value;
      instanceSettings.barChartColor = this.getCSSRgbValue(this.instanceSettingsForm.get('barChartColor').value);
      instanceSettings.matomoSiteId = this.instanceSettingsForm.get('matomoSiteId').value;
      instanceSettings.matomoTrackerUrl = this.instanceSettingsForm.get('matomoTrackerUrl').value;
      this.instanceSettingsService.updateInstanceSettings(instanceSettings).subscribe(instanceSettings => {
        this.store.dispatch(toastNotification(NotificationIdentifier.INSTANCE_SETTINGS_UPDATED));
        this.loadingState = LoadingState.DEFAULT;
        this.store.dispatch(updateInstanceSettings({settings: instanceSettings}))
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

  private getCSSRgbValue(raw: any): string {
    return `rgb(${raw.r}, ${raw.g}, ${raw.b})`
  }

}
