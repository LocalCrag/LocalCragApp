import { Routes } from '@angular/router';
import { isAdmin } from '../../../guards/is-admin';

export const appAlertRoutes: Routes = [
  {
    path: 'app-alerts',
    loadComponent: () =>
      import('../../app-alerts/app-alerts-list/app-alerts-list.component').then(
        (m) => m.AppAlertsListComponent,
      ),
    canActivate: [isAdmin],
  },
  {
    path: 'app-alerts/create',
    loadComponent: () =>
      import('../../app-alerts/app-alerts-form/app-alerts-form.component').then(
        (m) => m.AppAlertsFormComponent,
      ),
    canActivate: [isAdmin],
  },
  {
    path: 'app-alerts/:alert-id/edit',
    loadComponent: () =>
      import('../../app-alerts/app-alerts-form/app-alerts-form.component').then(
        (m) => m.AppAlertsFormComponent,
      ),
    canActivate: [isAdmin],
  },
];
