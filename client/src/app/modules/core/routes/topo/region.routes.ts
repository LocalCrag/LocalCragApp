import { Routes } from '@angular/router';
import { RegionComponent } from '../../../region/region/region.component';
import { RegionInfoComponent } from '../../../region/region-info/region-info.component';
import { CragListComponent } from '../../../crag/crag-list/crag-list.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { MapComponent } from '../../../maps/map/map.component';
import { RegionRulesComponent } from '../../../region/region-rules/region-rules.component';
import { GalleryComponent } from '../../../gallery/gallery/gallery.component';
import { CommentsComponent } from '../../../comments/comments/comments.component';
import { ModeratorTaskListComponent } from '../../../moderator-task/moderator-task-list/moderator-task-list.component';
import { RegionAscentsComponent } from '../../../region/region-ascents/region-ascents.component';
import { RankingListComponent } from '../../../ranking/ranking-list/ranking-list.component';
import { skipHierarchy } from '../../../../guards/skip-hierarchy';
import { isModerator } from '../../../../guards/is-moderator';
import { environment } from '../../../../../environments/environment';
import { ObjectType } from '../../../../models/object';
import { defaultBg, outletRoute } from '../route-helpers';

export const topoRegionRoute: Routes = [
  {
    path: 'topo',
    component: RegionComponent,
    data: defaultBg(),
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
      outletRoute('map', MapComponent, 'regionContent', {
        canActivate: [skipHierarchy(1, ['/topo'])],
      }),
      outletRoute('rules', RegionRulesComponent, 'regionContent', {
        canActivate: [skipHierarchy(1, ['/topo'], ['rules'])],
      }),
      outletRoute('gallery', GalleryComponent, 'regionContent'),
      outletRoute('comments', CommentsComponent, 'regionContent', {
        data: { objectType: ObjectType.Region },
      }),
      outletRoute(
        'moderator-tasks',
        ModeratorTaskListComponent,
        'regionContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Region },
        },
      ),
      outletRoute('ascents', RegionAscentsComponent, 'regionContent', {
        canActivate: [skipHierarchy(1, ['/topo'], ['ascents'])],
      }),
      outletRoute('ranking', RankingListComponent, 'regionContent', {
        canActivate: [skipHierarchy(1, ['/topo'], ['ranking'])],
      }),
    ],
  },
];
