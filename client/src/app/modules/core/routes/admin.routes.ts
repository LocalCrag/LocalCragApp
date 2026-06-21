import { Routes } from '@angular/router';
import { InstanceSettingsFormComponent } from '../instance-settings-form/instance-settings-form.component';
import { ScaleListComponent } from '../../scale/scale-list/scale-list.component';
import { ScaleFormComponent } from '../../scale/scale-form/scale-form.component';
import { HistoryListComponent } from '../../history/history-list/history-list.component';
import { isModerator } from '../../../guards/is-moderator';
import { isAdmin } from '../../../guards/is-admin';
import { authBg } from './route-helpers';

export const adminRoutes: Routes = [
  {
    path: 'instance-settings',
    component: InstanceSettingsFormComponent,
    canActivate: [isModerator],
    data: authBg(),
  },
  {
    path: 'scales',
    component: ScaleListComponent,
    canActivate: [isAdmin],
    data: authBg(),
  },
  {
    path: 'scales/create',
    component: ScaleFormComponent,
    canActivate: [isAdmin],
    data: authBg(),
  },
  {
    path: 'scales/:lineType/:name',
    component: ScaleFormComponent,
    canActivate: [isAdmin],
    data: authBg(),
  },
  {
    path: 'history',
    component: HistoryListComponent,
  },
];
