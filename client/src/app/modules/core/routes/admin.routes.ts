import { Routes } from '@angular/router';
import { isModerator } from '../../../guards/is-moderator';
import { isAdmin } from '../../../guards/is-admin';
import { authBg } from './route-helpers';

export const adminRoutes: Routes = [
  {
    path: 'instance-settings',
    loadComponent: () =>
      import('../instance-settings-form/instance-settings-form.component').then(
        (m) => m.InstanceSettingsFormComponent,
      ),
    canActivate: [isModerator],
    data: authBg(),
  },
  {
    path: 'scales',
    loadComponent: () =>
      import('../../scale/scale-list/scale-list.component').then(
        (m) => m.ScaleListComponent,
      ),
    canActivate: [isAdmin],
    data: authBg(),
  },
  {
    path: 'scales/create',
    loadComponent: () =>
      import('../../scale/scale-form/scale-form.component').then(
        (m) => m.ScaleFormComponent,
      ),
    canActivate: [isAdmin],
    data: authBg(),
  },
  {
    path: 'scales/:lineType/:name',
    loadComponent: () =>
      import('../../scale/scale-form/scale-form.component').then(
        (m) => m.ScaleFormComponent,
      ),
    canActivate: [isAdmin],
    data: authBg(),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('../../history/history-list/history-list.component').then(
        (m) => m.HistoryListComponent,
      ),
  },
];
