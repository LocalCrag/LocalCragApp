import { Routes } from '@angular/router';
import { CragComponent } from '../../../crag/crag/crag.component';
import { CragInfoComponent } from '../../../crag/crag-info/crag-info.component';
import { SectorListComponent } from '../../../sector/sector-list/sector-list.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { CragRulesComponent } from '../../../crag/crag-rules/crag-rules.component';
import { GalleryComponent } from '../../../gallery/gallery/gallery.component';
import { CommentsComponent } from '../../../comments/comments/comments.component';
import { ModeratorTaskListComponent } from '../../../moderator-task/moderator-task-list/moderator-task-list.component';
import { CragAscentsComponent } from '../../../crag/crag-ascents/crag-ascents.component';
import { CragWeatherComponent } from '../../../crag/crag-weather/crag-weather.component';
import { CragRankingComponent } from '../../../crag/crag-ranking/crag-ranking.component';
import { CragFormComponent } from '../../../crag/crag-form/crag-form.component';
import { SectorFormComponent } from '../../../sector/sector-form/sector-form.component';
import { skipHierarchy } from '../../../../guards/skip-hierarchy';
import { isModerator } from '../../../../guards/is-moderator';
import { environment } from '../../../../../environments/environment';
import { ObjectType } from '../../../../models/object';
import {
  defaultBg,
  moderatorTaskFormRoutes,
  outletRoute,
} from '../route-helpers';

const cragPrefix = 'topo/:crag-slug';

export const topoCragRoutes: Routes = [
  {
    path: cragPrefix,
    component: CragComponent,
    data: defaultBg(),
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [skipHierarchy(2, ['/topo'])],
        children: [
          {
            path: '',
            component: CragInfoComponent,
            outlet: 'cragContent',
          },
        ],
      },
      {
        path: 'sectors',
        children: [
          {
            path: '',
            canActivate: [
              skipHierarchy(
                2,
                ['/topo', environment.skippedSlug, environment.skippedSlug],
                ['areas'],
                false,
              ),
            ],
            component: SectorListComponent,
            outlet: 'cragContent',
          },
        ],
      },
      outletRoute('lines', LineListComponent, 'cragContent', {
        canActivate: [skipHierarchy(2, ['/topo'], ['lines'])],
      }),
      outletRoute('rules', CragRulesComponent, 'cragContent', {
        canActivate: [skipHierarchy(2, ['/topo'], ['rules'])],
      }),
      outletRoute('gallery', GalleryComponent, 'cragContent', {
        data: { objectType: ObjectType.Crag },
      }),
      outletRoute('comments', CommentsComponent, 'cragContent', {
        data: { objectType: ObjectType.Crag },
      }),
      outletRoute(
        'moderator-tasks',
        ModeratorTaskListComponent,
        'cragContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Crag },
        },
      ),
      outletRoute('ascents', CragAscentsComponent, 'cragContent', {
        canActivate: [skipHierarchy(2, ['/topo'], ['ascents'])],
      }),
      outletRoute('weather', CragWeatherComponent, 'cragContent', {
        canActivate: [skipHierarchy(2, ['/topo'], ['weather'])],
      }),
      outletRoute('ranking', CragRankingComponent, 'cragContent', {
        canActivate: [skipHierarchy(2, ['/topo'], ['ranking'])],
      }),
    ],
  },
  ...moderatorTaskFormRoutes(cragPrefix, ObjectType.Crag),
  {
    path: `${cragPrefix}/edit`,
    component: CragFormComponent,
    canActivate: [isModerator, skipHierarchy(2, ['/topo'], ['edit'])],
    data: defaultBg(),
  },
  {
    path: `${cragPrefix}/create-sector`,
    component: SectorFormComponent,
    canActivate: [
      isModerator,
      skipHierarchy(
        2,
        ['/topo', environment.skippedSlug, environment.skippedSlug],
        ['create-area'],
        false,
      ),
    ],
    data: defaultBg(),
  },
];
