import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { InputTextModule } from 'primeng/inputtext';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { UsersService } from '../../../services/crud/users.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import { Title } from '@angular/platform-browser';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { User } from '../../../models/user';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';
import { AvatarUploadComponent } from '../../shared/forms/controls/avatar-upload/avatar-upload.component';
import { updateAccountSettings } from '../../../ngrx/actions/auth.actions';
import { emailRegex } from '../../../utility/regex/email-regex';
import { UserValidatorsService } from '../../../services/core/user-validators.service';
import { NgIf } from '@angular/common';
import { emailsValidator } from '../../../utility/validators/emails.validator';
import { MessageModule } from 'primeng/message';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

@Component({
  selector: 'lc-account-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    TranslocoDirective,
    InputTextModule,
    AvatarUploadComponent,
    NgIf,
    MessageModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.scss',
})
@UntilDestroy()
export class AccountFormComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public accountForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState: LoadingState = LoadingState.DEFAULT;
  public emailChangedPreSave = false;
  public emailChangedPostSave = false;
  public savePressed = false;
  public currentUser: User;

  constructor(
    private usersService: UsersService,
    private userValidators: UserValidatorsService,
    private store: Store<AppState>,
    private title: Title,
    private translocoService: TranslocoService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('accountFormTabTitle'))} - ${instanceName}`,
      );
    });
  }

  public save() {
    this.savePressed = true;
    if (this.accountForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const user = new User();
      const emailChanged =
        this.currentUser.email !== this.accountForm.get('emails.email').value;
      user.firstname = this.accountForm.get('firstname').value;
      user.lastname = this.accountForm.get('lastname').value;
      user.email = this.accountForm.get('emails.email').value;
      user.avatar = this.accountForm.get('avatar').value;
      this.usersService.updateAccount(user).subscribe((updatedUser) => {
        this.store.dispatch(updateAccountSettings({ user: updatedUser }));
        this.store.dispatch(toastNotification('ACCOUNT_SETTINGS_UPDATED'));
        this.loadingState = LoadingState.DEFAULT;
        this.emailChangedPostSave = emailChanged;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

  private buildForm() {
    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe((currentUser) => {
        this.currentUser = currentUser;
        this.accountForm = this.fb.group({
          avatar: [currentUser.avatar],
          firstname: [
            currentUser.firstname,
            [Validators.required, Validators.maxLength(120)],
          ],
          lastname: [
            currentUser.lastname,
            [Validators.required, Validators.maxLength(120)],
          ],
          emails: this.fb.group(
            {
              email: [
                currentUser.email,
                {
                  validators: [
                    Validators.required,
                    Validators.pattern(emailRegex),
                    Validators.maxLength(120),
                  ],
                  asyncValidators: [
                    this.userValidators.emailValidator([currentUser.email]),
                  ],
                  updateOn: 'blur',
                },
              ],
              emailConfirm: [
                currentUser.email,
                {
                  validators: [
                    Validators.required,
                    Validators.pattern(emailRegex),
                    Validators.maxLength(120),
                  ],
                  asyncValidators: [
                    this.userValidators.emailValidator([currentUser.email]),
                  ],
                  updateOn: 'blur',
                },
              ],
            },
            {
              validators: emailsValidator(),
            },
          ),
        });
      });
    this.accountForm
      .get('emails.email')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        if (!this.emailChangedPreSave) {
          this.accountForm.get('emails.emailConfirm').setValue('');
        }
        this.emailChangedPreSave = true;
      });
  }

  public emailsDontMatch(): boolean {
    if (
      this.accountForm.get('emails.email').pristine ||
      this.accountForm.get('emails.emailConfirm').pristine
    ) {
      return false;
    }
    return (
      this.accountForm.get('emails').errors &&
      this.accountForm.get('emails').errors['emailsMatch']
    );
  }
}
