import { Routes } from '@angular/router';
import { isModerator } from '../../../guards/is-moderator';
import { isAdmin } from '../../../guards/is-admin';
import { defaultBg } from './route-helpers';

export const adminRoutes: Routes = [
  {
    path: 'instance-settings',
    loadComponent: () =>
      import('../instance-settings-form/instance-settings-form.component').then(
        (m) => m.InstanceSettingsFormComponent,
      ),
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'scales',
    loadComponent: () =>
      import('../../scale/scale-list/scale-list.component').then(
        (m) => m.ScaleListComponent,
      ),
    canActivate: [isAdmin],
    data: defaultBg(),
  },
  {
    path: 'scales/create',
    loadComponent: () =>
      import('../../scale/scale-form/scale-form.component').then(
        (m) => m.ScaleFormComponent,
      ),
    canActivate: [isAdmin],
    data: defaultBg(),
  },
  {
    path: 'scales/:lineType/:name',
    loadComponent: () =>
      import('../../scale/scale-form/scale-form.component').then(
        (m) => m.ScaleFormComponent,
      ),
    canActivate: [isAdmin],
    data: defaultBg(),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('../../history/history-list/history-list.component').then(
        (m) => m.HistoryListComponent,
      ),
  },
];
