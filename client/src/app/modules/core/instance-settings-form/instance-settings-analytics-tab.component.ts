import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

@Component({
  selector: 'lc-instance-settings-analytics-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ButtonModule,
    InputTextModule,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  template: `
    <ng-container
      *transloco="let t; read: 'instanceSettings.instanceSettingsForm'"
    >
      <div [formGroup]="group" class="flex flex-col gap-4 pt-4">
        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="matomo-tracker-url">{{
            t('matomoTrackerUrlLabel')
          }}</label>
          <input
            type="text"
            pInputText
            id="matomo-tracker-url"
            formControlName="matomoTrackerUrl"
            [placeholder]="t('matomoTrackerUrlPlaceholder')"
            lcFormControl
          />
          <small class="lc-error" *lcIfError="'maxlength'">{{
            'validation.maxLength' | transloco: { max: 120 }
          }}</small>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="matomo-site-id">{{
            t('matomoSiteIdLabel')
          }}</label>
          <input
            type="text"
            pInputText
            id="matomo-site-id"
            formControlName="matomoSiteId"
            [placeholder]="t('matomoSiteIdPlaceholder')"
            lcFormControl
          />
          <small class="lc-error" *lcIfError="'maxlength'">{{
            'validation.maxLength' | transloco: { max: 120 }
          }}</small>
        </div>

        <div class="form-actions">
          <p-button
            label="{{ t('editInstanceSettingsButtonLabel') }}"
            (click)="save()"
            icon="pi pi-save"
            class="responsive-button"
            [loading]="loading"
          ></p-button>
        </div>
      </div>
    </ng-container>
  `,
})
export class InstanceSettingsAnalyticsTabComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;
}
