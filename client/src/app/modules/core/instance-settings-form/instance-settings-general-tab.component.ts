import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { LanguageSelectComponent } from '../../shared/forms/controls/language-select/language-select.component';

@Component({
  selector: 'lc-instance-settings-general-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ButtonModule,
    Select,
    ToggleSwitch,
    InputTextModule,
    TooltipModule,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    LanguageSelectComponent,
  ],
  template: `
    <ng-container
      *transloco="let t; read: 'instanceSettings.instanceSettingsForm'"
    >
      <div [formGroup]="group" class="flex flex-col gap-4 pt-4">
        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="instance-name">{{
            t('instanceNameLabel')
          }}</label>
          <input
            type="text"
            pInputText
            id="instance-name"
            formControlName="instanceName"
            [placeholder]="t('instanceNamePlaceholder')"
            lcFormControl
          />
          <small class="lc-error" *lcIfError="'required'">{{
            'validation.required' | transloco
          }}</small>
          <small class="lc-error" *lcIfError="'maxlength'">{{
            'validation.maxLength' | transloco: { max: 120 }
          }}</small>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="copyright-owner">{{
            t('copyrightOwnerLabel')
          }}</label>
          <input
            id="copyright-owner"
            type="text"
            pInputText
            formControlName="copyrightOwner"
            [placeholder]="t('copyrightOwnerPlaceholder')"
            lcFormControl
          />
          <small class="lc-error" *lcIfError="'required'">{{
            'validation.required' | transloco
          }}</small>
          <small class="lc-error" *lcIfError="'maxlength'">{{
            'validation.maxLength' | transloco: { max: 120 }
          }}</small>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="mail-greeting">{{
            t('mailGreetingLabel')
          }}</label>
          <input
            id="mail-greeting"
            type="text"
            pInputText
            formControlName="mailGreeting"
            [placeholder]="t('mailGreetingPlaceholder')"
            lcFormControl
          />
          <small class="lc-error" *lcIfError="'required'">{{
            'validation.required' | transloco
          }}</small>
          <small class="lc-error" *lcIfError="'maxlength'">{{
            'validation.maxLength' | transloco: { max: 120 }
          }}</small>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="gym-mode">{{
            t('gymModeLabel')
          }}</label>
          <div class="flex items-center justify-center sm:justify-start">
            {{ t('gymModeLabelFalse') }}
            <p-toggleswitch
              id="gym-mode"
              class="mx-2 blue-green-switch"
              formControlName="gymMode"
              lcFormControl
            />
            {{ t('gymModeLabelTrue') }}
          </div>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="display-user-grades">{{
            t('displayUserGradesLabel')
          }}</label>
          <div class="flex items-center justify-center sm:justify-start">
            {{ t('displayUserGradesFalse') }}
            <p-toggleswitch
              id="display-user-grades"
              class="mx-2 blue-green-switch"
              formControlName="displayUserGrades"
              lcFormControl
            />
            {{ t('displayUserGradesTrue') }}
          </div>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <label class="form-label" for="display-user-ratings">{{
            t('displayUserRatingsLabel')
          }}</label>
          <div class="flex items-center justify-center sm:justify-start">
            {{ t('displayUserRatingsFalse') }}
            <p-toggleswitch
              id="display-user-ratings"
              class="mx-2 blue-green-switch"
              formControlName="displayUserRatings"
              lcFormControl
            />
            {{ t('displayUserRatingsTrue') }}
          </div>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <div class="form-label flex items-center">
            <label for="skippedHierarchicalLayers">{{
              t('skippedHierarchicalLayersLabel')
            }}</label>
            <span
              class="pi pi-question-circle ml-2"
              [pTooltip]="t('skippedHierarchicalLayersDescription')"
              tooltipPosition="right"
            ></span>
          </div>
          <p-select
            id="skippedHierarchicalLayers"
            [options]="[
              { value: 0, label: t('skippedHierarchicalLayersItemLabel0') },
              { value: 1, label: t('skippedHierarchicalLayersItemLabel1') },
              { value: 2, label: t('skippedHierarchicalLayersItemLabel2') },
            ]"
            optionLabel="label"
            optionValue="value"
            formControlName="skippedHierarchicalLayers"
            lcFormControl
          />
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <div class="form-label flex items-center">
            <label for="faDefaultFormat">{{ t('faDefaultFormat') }}</label>
            <span
              class="pi pi-question-circle ml-2"
              [pTooltip]="t('faDefaultFormatTooltip')"
              tooltipPosition="right"
            ></span>
          </div>
          <p-select
            id="faDefaultFormat"
            [options]="[
              { value: faDefaultFormats.YEAR, label: t('YEAR') },
              { value: faDefaultFormats.DATE, label: t('DATE') },
            ]"
            optionLabel="label"
            optionValue="value"
            formControlName="faDefaultFormat"
            lcFormControl
          />
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <div class="form-label flex items-center">
            <label for="defaultStartingPosition">{{
              t('defaultStartingPosition')
            }}</label>
          </div>
          <p-select
            id="defaultStartingPosition"
            [options]="startingPositionsOptions"
            optionLabel="label"
            optionValue="value"
            formControlName="defaultStartingPosition"
            lcFormControl
          />
          <small class="lc-error" *lcIfError="'required'">{{
            'validation.required' | transloco
          }}</small>
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <div class="form-label flex items-center">
            <label for="rankingPastWeeks">{{
              t('rankingPastWeeksLabel')
            }}</label>
            <span
              class="pi pi-question-circle ml-2"
              [pTooltip]="t('rankingPastWeeksTooltip')"
              tooltipPosition="right"
            ></span>
          </div>
          <p-select
            id="rankingPastWeeks"
            [options]="rankingPastWeeksOptions"
            optionLabel="label"
            optionValue="value"
            formControlName="rankingPastWeeks"
            lcFormControl
          />
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <div class="form-label flex items-center">
            <label for="language">{{ t('languageLabel') }}</label>
            <span
              class="pi pi-question-circle ml-2"
              [pTooltip]="t('instanceLanguageTooltip')"
              tooltipPosition="right"
            ></span>
          </div>
          <lc-language-select
            id="language"
            formControlName="language"
            lcFormControl
          />
        </div>

        <div class="flex flex-col gap-2" lcControlGroup>
          <div class="form-label flex items-center">
            <label for="timezone">{{ t('timezoneLabel') }}</label>
            <span
              class="pi pi-question-circle ml-2"
              [pTooltip]="t('timezoneTooltip')"
              tooltipPosition="right"
            ></span>
          </div>
          <p-select
            id="timezone"
            [options]="timezoneOptions"
            optionLabel="label"
            optionValue="value"
            [filter]="true"
            formControlName="timezone"
            lcFormControl
          />
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
export class InstanceSettingsGeneralTabComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) faDefaultFormats: any;
  @Input({ required: true }) startingPositionsOptions!: {
    label: string;
    value: string;
  }[];
  @Input({ required: true }) rankingPastWeeksOptions!: {
    label: string;
    value: number | null;
  }[];
  @Input({ required: true }) timezoneOptions!: {
    label: string;
    value: string;
  }[];
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;
}
