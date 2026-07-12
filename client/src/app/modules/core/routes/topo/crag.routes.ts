import { Routes } from '@angular/router';
import { CragComponent } from '../../../crag/crag/crag.component';
import { CragInfoComponent } from '../../../crag/crag-info/crag-info.component';
import { SectorListComponent } from '../../../sector/sector-list/sector-list.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { CragAscentsComponent } from '../../../crag/crag-ascents/crag-ascents.component';
import { skipHierarchy } from '../../../../guards/skip-hierarchy';
import { isModerator } from '../../../../guards/is-moderator';
import { environment } from '../../../../../environments/environment';
import { ObjectType } from '../../../../models/object';
import {
  lazyOutletRoute,
  loadCommentsComponent,
  loadGalleryComponent,
  moderatorTaskFormRoutes,
  outletRoute,
} from '../route-helpers';

const cragPrefix = 'topo/:crag-slug';

export const topoCragRoutes: Routes = [
  {
    path: cragPrefix,
    component: CragComponent,
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
      lazyOutletRoute(
        'rules',
        () =>
          import('../../../crag/crag-rules/crag-rules.component').then(
            (m) => m.CragRulesComponent,
          ),
        'cragContent',
        {
          canActivate: [skipHierarchy(2, ['/topo'], ['rules'])],
        },
      ),
      lazyOutletRoute('gallery', loadGalleryComponent, 'cragContent', {
        data: { objectType: ObjectType.Crag },
      }),
      lazyOutletRoute('comments', loadCommentsComponent, 'cragContent', {
        data: { objectType: ObjectType.Crag },
      }),
      lazyOutletRoute(
        'moderator-tasks',
        () =>
          import('../../../moderator-task/moderator-task-list/moderator-task-list.component').then(
            (m) => m.ModeratorTaskListComponent,
          ),
        'cragContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Crag },
        },
      ),
      outletRoute('ascents', CragAscentsComponent, 'cragContent', {
        canActivate: [skipHierarchy(2, ['/topo'], ['ascents'])],
      }),
      lazyOutletRoute(
        'weather',
        () =>
          import('../../../crag/crag-weather/crag-weather.component').then(
            (m) => m.CragWeatherComponent,
          ),
        'cragContent',
        {
          canActivate: [skipHierarchy(2, ['/topo'], ['weather'])],
        },
      ),
      lazyOutletRoute(
        'ranking',
        () =>
          import('../../../crag/crag-ranking/crag-ranking.component').then(
            (m) => m.CragRankingComponent,
          ),
        'cragContent',
        {
          canActivate: [skipHierarchy(2, ['/topo'], ['ranking'])],
        },
      ),
    ],
  },
  ...moderatorTaskFormRoutes(cragPrefix, ObjectType.Crag),
  {
    path: `${cragPrefix}/edit`,
    loadComponent: () =>
      import('../../../crag/crag-form/crag-form.component').then(
        (m) => m.CragFormComponent,
      ),
    canActivate: [isModerator, skipHierarchy(2, ['/topo'], ['edit'])],
  },
  {
    path: `${cragPrefix}/create-sector`,
    loadComponent: () =>
      import('../../../sector/sector-form/sector-form.component').then(
        (m) => m.SectorFormComponent,
      ),
    canActivate: [
      isModerator,
      skipHierarchy(
        2,
        ['/topo', environment.skippedSlug, environment.skippedSlug],
        ['create-area'],
        false,
      ),
    ],
  },
];
