import { Routes } from '@angular/router';
import { SectorComponent } from '../../../sector/sector/sector.component';
import { SectorInfoComponent } from '../../../sector/sector-info/sector-info.component';
import { AreaListComponent } from '../../../area/area-list/area-list.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { SectorAscentsComponent } from '../../../sector/sector-ascents/sector-ascents.component';
import { isModerator } from '../../../../guards/is-moderator';
import { ObjectType } from '../../../../models/object';
import {
  lazyOutletRoute,
  loadCommentsComponent,
  loadGalleryComponent,
  moderatorTaskFormRoutes,
  outletRoute,
} from '../route-helpers';

const sectorPrefix = 'topo/:crag-slug/:sector-slug';

export const topoSectorRoutes: Routes = [
  {
    path: sectorPrefix,
    component: SectorComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        children: [
          {
            path: '',
            component: SectorInfoComponent,
            outlet: 'sectorContent',
          },
        ],
      },
      outletRoute('areas', AreaListComponent, 'sectorContent'),
      lazyOutletRoute(
        'rules',
        () =>
          import('../../../sector/sector-rules/sector-rules.component').then(
            (m) => m.SectorRulesComponent,
          ),
        'sectorContent',
      ),
      outletRoute('lines', LineListComponent, 'sectorContent'),
      lazyOutletRoute('gallery', loadGalleryComponent, 'sectorContent', {
        data: { objectType: ObjectType.Sector },
      }),
      lazyOutletRoute('comments', loadCommentsComponent, 'sectorContent', {
        data: { objectType: ObjectType.Sector },
      }),
      lazyOutletRoute(
        'moderator-tasks',
        () =>
          import('../../../moderator-task/moderator-task-list/moderator-task-list.component').then(
            (m) => m.ModeratorTaskListComponent,
          ),
        'sectorContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Sector },
        },
      ),
      outletRoute('ascents', SectorAscentsComponent, 'sectorContent'),
      lazyOutletRoute(
        'weather',
        () =>
          import('../../../sector/sector-weather/sector-weather.component').then(
            (m) => m.SectorWeatherComponent,
          ),
        'sectorContent',
      ),
      lazyOutletRoute(
        'ranking',
        () =>
          import('../../../sector/sector-ranking/sector-ranking.component').then(
            (m) => m.SectorRankingComponent,
          ),
        'sectorContent',
      ),
    ],
  },
  ...moderatorTaskFormRoutes(sectorPrefix, ObjectType.Sector),
  {
    path: `${sectorPrefix}/edit`,
    loadComponent: () =>
      import('../../../sector/sector-form/sector-form.component').then(
        (m) => m.SectorFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: `${sectorPrefix}/create-area`,
    loadComponent: () =>
      import('../../../area/area-form/area-form.component').then(
        (m) => m.AreaFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: `${sectorPrefix}/:area-slug/create-line`,
    loadComponent: () =>
      import('../../../line/line-form/line-form.component').then(
        (m) => m.LineFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: `${sectorPrefix}/:area-slug/add-topo-image`,
    loadComponent: () =>
      import('../../../topo-images/topo-image-form/topo-image-form.component').then(
        (m) => m.TopoImageFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: `${sectorPrefix}/:area-slug/line-entry-batch-editor`,
    loadComponent: () =>
      import('../../../batch-editor/line-entry-batch-editor/line-entry-batch-editor.component').then(
        (m) => m.LineEntryBatchEditorComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: `${sectorPrefix}/:area-slug/topo-images/:image-id/edit`,
    loadComponent: () =>
      import('../../../topo-images/topo-image-form/topo-image-form.component').then(
        (m) => m.TopoImageFormComponent,
      ),
    canActivate: [isModerator],
  },
];
