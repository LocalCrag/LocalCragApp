import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';
import { ForgotPasswordCheckMailboxComponent } from '../forgot-password-check-mailbox/forgot-password-check-mailbox.component';
import { RegisterComponent } from '../register/register.component';
import { RegisterCheckMailboxComponent } from '../register-check-mailbox/register-check-mailbox.component';
import { ActivateAccountComponent } from '../activate-account/activate-account.component';
import { AccountFormComponent } from '../account-form/account-form.component';
import { ChangeEmailComponent } from '../change-email/change-email.component';
import { NotificationListComponent } from '../notification-list/notification-list.component';
import { ReleaseNotesBundleComponent } from '../release-notes-bundle/release-notes-bundle.component';
import { isLoggedOut } from '../../../guards/is-logged-out';
import { isLoggedIn } from '../../../guards/is-logged-in';
import { authBg } from './route-helpers';

export const authRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [isLoggedOut],
    data: authBg(),
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [isLoggedIn],
    data: authBg(),
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [isLoggedOut],
    data: authBg(),
  },
  {
    path: 'register-check-mailbox',
    component: RegisterCheckMailboxComponent,
    canActivate: [isLoggedOut],
    data: authBg(),
  },
  {
    path: 'account',
    component: AccountFormComponent,
    canActivate: [isLoggedIn],
    data: authBg(),
  },
  {
    path: 'activate-account',
    component: ActivateAccountComponent,
    data: authBg(),
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [isLoggedOut],
    data: authBg(),
  },
  {
    path: 'forgot-password-check-mailbox',
    component: ForgotPasswordCheckMailboxComponent,
    canActivate: [isLoggedOut],
    data: authBg(),
  },
  {
    path: 'reset-password/:hash',
    component: ResetPasswordComponent,
    canActivate: [isLoggedOut],
    data: authBg(),
  },
  {
    path: 'change-email/:hash',
    component: ChangeEmailComponent,
    canActivate: [isLoggedIn],
    data: authBg(),
  },
  {
    path: 'notifications',
    component: NotificationListComponent,
    canActivate: [isLoggedIn],
    data: authBg(),
  },
  {
    path: 'release-notes/:bundleId',
    component: ReleaseNotesBundleComponent,
    canActivate: [isLoggedIn],
    data: authBg(),
  },
];
