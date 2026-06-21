import { Routes } from '@angular/router';
import { SectorComponent } from '../../../sector/sector/sector.component';
import { SectorInfoComponent } from '../../../sector/sector-info/sector-info.component';
import { AreaListComponent } from '../../../area/area-list/area-list.component';
import { LineListComponent } from '../../../line/line-list/line-list.component';
import { SectorRulesComponent } from '../../../sector/sector-rules/sector-rules.component';
import { GalleryComponent } from '../../../gallery/gallery/gallery.component';
import { CommentsComponent } from '../../../comments/comments/comments.component';
import { ModeratorTaskListComponent } from '../../../moderator-task/moderator-task-list/moderator-task-list.component';
import { SectorAscentsComponent } from '../../../sector/sector-ascents/sector-ascents.component';
import { SectorWeatherComponent } from '../../../sector/sector-weather/sector-weather.component';
import { SectorRankingComponent } from '../../../sector/sector-ranking/sector-ranking.component';
import { SectorFormComponent } from '../../../sector/sector-form/sector-form.component';
import { AreaFormComponent } from '../../../area/area-form/area-form.component';
import { LineFormComponent } from '../../../line/line-form/line-form.component';
import { TopoImageFormComponent } from '../../../topo-images/topo-image-form/topo-image-form.component';
import { LineEntryBatchEditorComponent } from '../../../batch-editor/line-entry-batch-editor/line-entry-batch-editor.component';
import { isModerator } from '../../../../guards/is-moderator';
import { ObjectType } from '../../../../models/object';
import {
  defaultBg,
  moderatorTaskFormRoutes,
  outletRoute,
} from '../route-helpers';

const sectorPrefix = 'topo/:crag-slug/:sector-slug';

export const topoSectorRoutes: Routes = [
  {
    path: sectorPrefix,
    component: SectorComponent,
    data: defaultBg(),
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
      outletRoute('rules', SectorRulesComponent, 'sectorContent'),
      outletRoute('lines', LineListComponent, 'sectorContent'),
      outletRoute('gallery', GalleryComponent, 'sectorContent', {
        data: { objectType: ObjectType.Sector },
      }),
      outletRoute('comments', CommentsComponent, 'sectorContent', {
        data: { objectType: ObjectType.Sector },
      }),
      outletRoute(
        'moderator-tasks',
        ModeratorTaskListComponent,
        'sectorContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Sector },
        },
      ),
      outletRoute('ascents', SectorAscentsComponent, 'sectorContent'),
      outletRoute('weather', SectorWeatherComponent, 'sectorContent'),
      outletRoute('ranking', SectorRankingComponent, 'sectorContent'),
    ],
  },
  ...moderatorTaskFormRoutes(sectorPrefix, ObjectType.Sector),
  {
    path: `${sectorPrefix}/edit`,
    component: SectorFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: `${sectorPrefix}/create-area`,
    component: AreaFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: `${sectorPrefix}/:area-slug/create-line`,
    component: LineFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: `${sectorPrefix}/:area-slug/add-topo-image`,
    component: TopoImageFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: `${sectorPrefix}/:area-slug/line-entry-batch-editor`,
    component: LineEntryBatchEditorComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: `${sectorPrefix}/:area-slug/topo-images/:image-id/edit`,
    component: TopoImageFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
];
