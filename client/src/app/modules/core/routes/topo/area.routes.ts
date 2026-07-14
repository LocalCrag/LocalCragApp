import { Routes } from '@angular/router';
import { AreaComponent } from '../../../area/area/area.component';
import { AreaInfoComponent } from '../../../area/area-info/area-info.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { TopoImageListComponent } from '../../../topo-images/topo-image-list/topo-image-list.component';
import { AreaAscentsComponent } from '../../../area/area-ascents/area-ascents.component';
import { isModerator } from '../../../../guards/is-moderator';
import { ObjectType } from '../../../../models/object';
import {
  lazyOutletRoute,
  loadCommentsComponent,
  loadGalleryComponent,
  moderatorTaskFormRoutes,
  outletRoute,
} from '../route-helpers';

const areaPrefix = 'topo/:crag-slug/:sector-slug/:area-slug';

export const topoAreaRoutes: Routes = [
  {
    path: areaPrefix,
    component: AreaComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        children: [
          {
            path: '',
            component: AreaInfoComponent,
            outlet: 'areaContent',
          },
        ],
      },
      outletRoute('lines', LineListComponent, 'areaContent', {
        pathMatch: 'full',
      }),
      outletRoute('topo-images', TopoImageListComponent, 'areaContent', {
        pathMatch: 'full',
      }),
      lazyOutletRoute('gallery', loadGalleryComponent, 'areaContent', {
        data: { objectType: ObjectType.Area },
      }),
      lazyOutletRoute('comments', loadCommentsComponent, 'areaContent', {
        data: { objectType: ObjectType.Area },
      }),
      lazyOutletRoute(
        'moderator-tasks',
        () =>
          import('../../../moderator-task/moderator-task-list/moderator-task-list.component').then(
            (m) => m.ModeratorTaskListComponent,
          ),
        'areaContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Area },
        },
      ),
      outletRoute('ascents', AreaAscentsComponent, 'areaContent'),
      lazyOutletRoute(
        'weather',
        () =>
          import('../../../area/area-weather/area-weather.component').then(
            (m) => m.AreaWeatherComponent,
          ),
        'areaContent',
      ),
    ],
  },
  ...moderatorTaskFormRoutes(areaPrefix, ObjectType.Area),
  {
    path: `${areaPrefix}/edit`,
    loadComponent: () =>
      import('../../../area/area-form/area-form.component').then(
        (m) => m.AreaFormComponent,
      ),
    canActivate: [isModerator],
  },
];
