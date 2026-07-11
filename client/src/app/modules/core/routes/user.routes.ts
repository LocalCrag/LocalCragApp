import { Routes } from '@angular/router';
import { UserDetailComponent } from '../../user/user-detail/user-detail.component';
import { UserAscentsComponent } from '../../user/user-ascents/user-ascents.component';
import { isModerator } from '../../../guards/is-moderator';
import { ObjectType } from '../../../models/object';
import {
  defaultBg,
  lazyOutletRoute,
  loadGalleryComponent,
  outletRoute,
} from './route-helpers';

export const userRoutes: Routes = [
  {
    path: 'users',
    loadComponent: () =>
      import('../../user/user-list/user-list.component').then(
        (m) => m.UserListComponent,
      ),
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'users/:user-slug',
    component: UserDetailComponent,
    data: defaultBg(),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'ascents',
      },
      outletRoute('ascents', UserAscentsComponent, 'userContent'),
      lazyOutletRoute(
        'charts',
        () =>
          import('../../user/user-charts/user-charts.component').then(
            (m) => m.UserChartsComponent,
          ),
        'userContent',
      ),
      lazyOutletRoute('gallery', loadGalleryComponent, 'userContent', {
        data: { objectType: ObjectType.User },
      }),
    ],
  },
];
