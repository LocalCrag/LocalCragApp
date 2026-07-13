import { Routes } from '@angular/router';
import { RegionComponent } from '../../../region/region/region.component';
import { RegionInfoComponent } from '../../../region/region-info/region-info.component';
import { CragListComponent } from '../../../crag/crag-list/crag-list.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { RegionAscentsComponent } from '../../../region/region-ascents/region-ascents.component';
import { skipHierarchy } from '../../../../guards/skip-hierarchy';
import { isModerator } from '../../../../guards/is-moderator';
import { environment } from '../../../../../environments/environment';
import { ObjectType } from '../../../../models/object';
import {
  lazyOutletRoute,
  loadCommentsComponent,
  loadGalleryComponent,
  outletRoute,
} from '../route-helpers';

export const topoRegionRoute: Routes = [
  {
    path: 'topo',
    component: RegionComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [skipHierarchy(1, ['/topo'])],
        children: [
          {
            path: '',
            component: RegionInfoComponent,
            outlet: 'regionContent',
          },
        ],
      },
      {
        path: 'crags',
        canActivate: [
          skipHierarchy(
            1,
            ['/topo', environment.skippedSlug],
            ['sectors'],
            false,
          ),
        ],
        children: [
          {
            path: '',
            component: CragListComponent,
            outlet: 'regionContent',
          },
        ],
      },
      outletRoute('lines', LineListComponent, 'regionContent', {
        canActivate: [skipHierarchy(1, ['/topo'], ['lines'])],
      }),
      lazyOutletRoute(
        'rules',
        () =>
          import('../../../region/region-rules/region-rules.component').then(
            (m) => m.RegionRulesComponent,
          ),
        'regionContent',
        {
          canActivate: [skipHierarchy(1, ['/topo'], ['rules'])],
        },
      ),
      lazyOutletRoute('gallery', loadGalleryComponent, 'regionContent'),
      lazyOutletRoute('comments', loadCommentsComponent, 'regionContent', {
        data: { objectType: ObjectType.Region },
      }),
      lazyOutletRoute(
        'moderator-tasks',
        () =>
          import('../../../moderator-task/moderator-task-list/moderator-task-list.component').then(
            (m) => m.ModeratorTaskListComponent,
          ),
        'regionContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Region },
        },
      ),
      outletRoute('ascents', RegionAscentsComponent, 'regionContent', {
        canActivate: [skipHierarchy(1, ['/topo'], ['ascents'])],
      }),
      lazyOutletRoute(
        'ranking',
        () =>
          import('../../../ranking/ranking-list/ranking-list.component').then(
            (m) => m.RankingListComponent,
          ),
        'regionContent',
        {
          canActivate: [skipHierarchy(1, ['/topo'], ['ranking'])],
        },
      ),
    ],
  },
];
