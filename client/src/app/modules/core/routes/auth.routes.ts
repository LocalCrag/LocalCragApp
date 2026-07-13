import { Routes } from '@angular/router';
import { isLoggedOut } from '../../../guards/is-logged-out';
import { isLoggedIn } from '../../../guards/is-logged-in';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../login/login.component').then((m) => m.LoginComponent),
    canActivate: [isLoggedOut],
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('../change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent,
      ),
    canActivate: [isLoggedIn],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../register/register.component').then((m) => m.RegisterComponent),
    canActivate: [isLoggedOut],
  },
  {
    path: 'register-check-mailbox',
    loadComponent: () =>
      import('../register-check-mailbox/register-check-mailbox.component').then(
        (m) => m.RegisterCheckMailboxComponent,
      ),
    canActivate: [isLoggedOut],
  },
  {
    path: 'account',
    loadComponent: () =>
      import('../account-form/account-form.component').then(
        (m) => m.AccountFormComponent,
      ),
    canActivate: [isLoggedIn],
  },
  {
    path: 'activate-account',
    loadComponent: () =>
      import('../activate-account/activate-account.component').then(
        (m) => m.ActivateAccountComponent,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('../forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    canActivate: [isLoggedOut],
  },
  {
    path: 'forgot-password-check-mailbox',
    loadComponent: () =>
      import('../forgot-password-check-mailbox/forgot-password-check-mailbox.component').then(
        (m) => m.ForgotPasswordCheckMailboxComponent,
      ),
    canActivate: [isLoggedOut],
  },
  {
    path: 'reset-password/:hash',
    loadComponent: () =>
      import('../reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
    canActivate: [isLoggedOut],
  },
  {
    path: 'change-email/:hash',
    loadComponent: () =>
      import('../change-email/change-email.component').then(
        (m) => m.ChangeEmailComponent,
      ),
    canActivate: [isLoggedIn],
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('../notification-list/notification-list.component').then(
        (m) => m.NotificationListComponent,
      ),
    canActivate: [isLoggedIn],
  },
  {
    path: 'release-notes/:bundleId',
    loadComponent: () =>
      import('../release-notes-bundle/release-notes-bundle.component').then(
        (m) => m.ReleaseNotesBundleComponent,
      ),
    canActivate: [isLoggedIn],
  },
];
