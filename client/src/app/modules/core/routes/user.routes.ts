import { Routes } from '@angular/router';
import { UserListComponent } from '../../user/user-list/user-list.component';
import { UserDetailComponent } from '../../user/user-detail/user-detail.component';
import { UserAscentsComponent } from '../../user/user-ascents/user-ascents.component';
import { UserChartsComponent } from '../../user/user-charts/user-charts.component';
import { GalleryComponent } from '../../gallery/gallery/gallery.component';
import { isModerator } from '../../../guards/is-moderator';
import { ObjectType } from '../../../models/object';
import { authBg, outletRoute } from './route-helpers';

export const userRoutes: Routes = [
  {
    path: 'users',
    component: UserListComponent,
    canActivate: [isModerator],
    data: authBg(),
  },
  {
    path: 'users/:user-slug',
    component: UserDetailComponent,
    data: authBg(),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'ascents',
      },
      outletRoute('ascents', UserAscentsComponent, 'userContent'),
      outletRoute('charts', UserChartsComponent, 'userContent'),
      outletRoute('gallery', GalleryComponent, 'userContent', {
        data: { objectType: ObjectType.User },
      }),
    ],
  },
];
