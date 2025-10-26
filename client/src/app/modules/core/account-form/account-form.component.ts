import {
  Component,
  DestroyRef,
  HostBinding,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import {
  updateAccountSettings,
  logout,
} from '../../../ngrx/actions/auth.actions';
import { emailRegex } from '../../../utility/regex/email-regex';
import { UserValidatorsService } from '../../../services/core/user-validators.service';

import { emailsValidator } from '../../../utility/validators/emails.validator';
import { MessageModule } from 'primeng/message';

import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { DividerModule } from 'primeng/divider';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DeleteOwnUserDialogComponent } from '../delete-own-user-dialog/delete-own-user-dialog.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-account-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    TranslocoDirective,
    InputTextModule,
    AvatarUploadComponent,
    MessageModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    DividerModule,
    HasPermissionDirective,
    HasPermissionDirective,
  ],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.scss',
  providers: [DialogService],
})
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
  public deleteLoadingState: LoadingState = LoadingState.DEFAULT;
  public deleteError = false;
  public ref: DynamicDialogRef | undefined;

  private destroyRef = inject(DestroyRef);
  private usersService = inject(UsersService);
  private userValidators = inject(UserValidatorsService);
  private store = inject<Store<AppState>>(Store);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private fb = inject(FormBuilder);
  private dialogService = inject(DialogService);

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
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
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

  public openDeleteDialog() {
    this.deleteError = false;
    this.ref = this.dialogService.open(DeleteOwnUserDialogComponent, {
      header: this.translocoService.translate(
        marker('accountForm.deleteAccountDialogTitle'),
      ),
      data: { email: this.currentUser?.email },
      width: '500px',
      dismissableMask: true,
      closable: false,
    });
    this.ref.onClose.pipe(take(1)).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.deleteLoadingState = LoadingState.LOADING;
        this.usersService.deleteOwnUser().subscribe({
          next: () => {
            this.deleteLoadingState = LoadingState.DEFAULT;
            // Auto logout after successful deletion
            this.store.dispatch(logout({ isAutoLogout: true, silent: false }));
          },
          error: () => {
            this.deleteLoadingState = LoadingState.DEFAULT;
            this.deleteError = true;
          },
        });
      }
    });
  }
}
