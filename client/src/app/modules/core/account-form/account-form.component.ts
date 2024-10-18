import { Component, HostBinding, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
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
import { Router } from '@angular/router';
import { UsersService } from '../../../services/crud/users.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import { Title } from '@angular/platform-browser';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { User } from '../../../models/user';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';
import { AvatarUploadComponent } from '../../shared/forms/controls/avatar-upload/avatar-upload.component';
import { updateAccountSettings } from '../../../ngrx/actions/auth.actions';
import { emailRegex } from '../../../utility/regex/email-regex';
import { UserValidatorsService } from '../../../services/core/user-validators.service';
import { MessagesModule } from 'primeng/messages';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lc-account-form',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    ButtonModule,
    TranslocoDirective,
    InputTextModule,
    AvatarUploadComponent,
    MessagesModule,
    NgIf,
  ],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.scss',
})
export class AccountFormComponent {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public accountForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState: LoadingState = LoadingState.DEFAULT;
  public emailChanged = false;

  private currentUser: User;

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
    if (this.accountForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const user = new User();
      const emailChanged =
        this.currentUser.email !== this.accountForm.get('email').value;
      user.firstname = this.accountForm.get('firstname').value;
      user.lastname = this.accountForm.get('lastname').value;
      user.email = this.accountForm.get('email').value;
      user.avatar = this.accountForm.get('avatar').value;
      this.usersService.updateAccount(user).subscribe((updatedUser) => {
        this.store.dispatch(updateAccountSettings({ user: updatedUser }));
        this.store.dispatch(
          toastNotification(NotificationIdentifier.ACCOUNT_SETTINGS_UPDATED),
        );
        this.loadingState = LoadingState.DEFAULT;
        this.emailChanged = emailChanged;
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
        });
      });
  }
}
