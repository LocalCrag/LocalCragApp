import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormDirective } from '../../shared/forms/form.directive';
import { Button } from 'primeng/button';
import { LoadingState } from '../../../enums/loading-state';
import { AccountService } from '../../../services/crud/account.service';
import { AccountSettings } from '../../../models/account-settings';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';
import { LanguageSelectComponent } from '../../shared/forms/controls/language-select/language-select.component';
import { Tooltip } from 'primeng/tooltip';
import { Divider } from 'primeng/divider';
import { LanguageService } from '../../../services/core/language.service';

@Component({
  selector: 'lc-account-settings-form',
  imports: [
    ToggleSwitch,
    ReactiveFormsModule,
    FormControlDirective,
    ControlGroupDirective,
    TranslocoDirective,
    FormDirective,
    Button,
    LanguageSelectComponent,
    Tooltip,
    Divider,
  ],
  templateUrl: './account-settings-form.component.html',
  styleUrl: './account-settings-form.component.scss',
})
export class AccountSettingsFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public accountSettingsForm: FormGroup;
  public accountSettings: AccountSettings;
  public loadingState = LoadingState.INITIAL_LOADING;
  protected readonly loadingStates = LoadingState;

  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private languageService = inject(LanguageService);

  private buildForm() {
    this.accountSettingsForm = this.fb.group({
      commentReplyMailsEnabled: [null],
      language: [null],
    });
  }

  ngOnInit() {
    this.buildForm();
    this.accountSettingsForm.disable();
    this.accountService.getAccountSettings().subscribe((accountSettings) => {
      this.accountSettings = accountSettings;
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  private setFormValue() {
    this.accountSettingsForm.enable();
    this.accountSettingsForm.patchValue({
      commentReplyMailsEnabled: this.accountSettings.commentReplyMailsEnabled,
      language: this.accountSettings.language,
    });
  }

  public saveAccountSettings() {
    if (this.accountSettingsForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const accountSettings = new AccountSettings();
      accountSettings.commentReplyMailsEnabled = this.accountSettingsForm.get(
        'commentReplyMailsEnabled',
      ).value;
      accountSettings.language = this.accountSettingsForm.get('language').value;
      this.accountService.updateAccountSettings(accountSettings).subscribe({
        next: () => {
          this.store.dispatch(toastNotification('ACCOUNT_SETTINGS_UPDATED'));
          this.loadingState = LoadingState.DEFAULT;
        },
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }
}
