import { Routes } from '@angular/router';
import { LineComponent } from '../../../line/line/line.component';
import { LineInfoComponent } from '../../../line/line-info/line-info.component';
import { LineAscentsComponent } from '../../../line/line-ascents/line-ascents.component';
import { isModerator } from '../../../../guards/is-moderator';
import { ObjectType } from '../../../../models/object';
import {
  defaultBg,
  lazyOutletRoute,
  loadCommentsComponent,
  loadGalleryComponent,
  moderatorTaskFormRoutes,
  outletRoute,
} from '../route-helpers';

const linePrefix = 'topo/:crag-slug/:sector-slug/:area-slug/:line-slug';

export const topoLineRoutes: Routes = [
  {
    path: linePrefix,
    component: LineComponent,
    data: defaultBg(),
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: LineInfoComponent,
        outlet: 'lineContent',
      },
      outletRoute('ascents', LineAscentsComponent, 'lineContent'),
      lazyOutletRoute('gallery', loadGalleryComponent, 'lineContent', {
        data: { objectType: ObjectType.Line },
      }),
      lazyOutletRoute('comments', loadCommentsComponent, 'lineContent', {
        data: { objectType: ObjectType.Line },
      }),
      lazyOutletRoute(
        'moderator-tasks',
        () =>
          import('../../../moderator-task/moderator-task-list/moderator-task-list.component').then(
            (m) => m.ModeratorTaskListComponent,
          ),
        'lineContent',
        {
          canActivate: [isModerator],
          data: { scopeType: ObjectType.Line },
        },
      ),
    ],
  },
  ...moderatorTaskFormRoutes(linePrefix, ObjectType.Line),
  {
    path: `${linePrefix}/edit`,
    loadComponent: () =>
      import('../../../line/line-form/line-form.component').then(
        (m) => m.LineFormComponent,
      ),
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/topo-images/:topo-image-id/add-line-path',
    loadComponent: () =>
      import('../../../line-path-editor/line-path-form-wrapper/line-path-form-wrapper.component').then(
        (m) => m.LinePathFormWrapperComponent,
      ),
    canActivate: [isModerator],
    data: defaultBg(),
  },
];
