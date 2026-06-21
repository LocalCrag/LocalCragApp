import { Routes } from '@angular/router';
import { AreaComponent } from '../../../area/area/area.component';
import { AreaInfoComponent } from '../../../area/area-info/area-info.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { TopoImageListComponent } from '../../../topo-images/topo-image-list/topo-image-list.component';
import { GalleryComponent } from '../../../gallery/gallery/gallery.component';
import { CommentsComponent } from '../../../comments/comments/comments.component';
import { ModeratorTaskListComponent } from '../../../moderator-task/moderator-task-list/moderator-task-list.component';
import { AreaAscentsComponent } from '../../../area/area-ascents/area-ascents.component';
import { AreaWeatherComponent } from '../../../area/area-weather/area-weather.component';
import { AreaFormComponent } from '../../../area/area-form/area-form.component';
import { isModerator } from '../../../../guards/is-moderator';
import { ObjectType } from '../../../../models/object';
import {
  defaultBg,
  moderatorTaskFormRoutes,
  outletRoute,
} from '../route-helpers';

const areaPrefix = 'topo/:crag-slug/:sector-slug/:area-slug';

export const topoAreaRoutes: Routes = [
  {
    path: areaPrefix,
    component: AreaComponent,
    data: defaultBg(),
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
      outletRoute('gallery', GalleryComponent, 'areaContent', {
        data: { objectType: ObjectType.Area },
      }),
      outletRoute('comments', CommentsComponent, 'areaContent', {
        data: { objectType: ObjectType.Area },
      }),
      outletRoute(
        'moderator-tasks',
        ModeratorTaskListComponent,
        'areaContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Area },
        },
      ),
      outletRoute('ascents', AreaAscentsComponent, 'areaContent'),
      outletRoute('weather', AreaWeatherComponent, 'areaContent'),
    ],
  },
  ...moderatorTaskFormRoutes(areaPrefix, ObjectType.Area),
  {
    path: `${areaPrefix}/edit`,
    component: AreaFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
];
