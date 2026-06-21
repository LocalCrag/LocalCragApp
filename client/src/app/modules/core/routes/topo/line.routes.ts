import { Routes } from '@angular/router';
import { LineComponent } from '../../../line/line/line.component';
import { LineInfoComponent } from '../../../line/line-info/line-info.component';
import { LineAscentsComponent } from '../../../line/line-ascents/line-ascents.component';
import { GalleryComponent } from '../../../gallery/gallery/gallery.component';
import { CommentsComponent } from '../../../comments/comments/comments.component';
import { ModeratorTaskListComponent } from '../../../moderator-task/moderator-task-list/moderator-task-list.component';
import { LineFormComponent } from '../../../line/line-form/line-form.component';
import { LinePathFormWrapperComponent } from '../../../line-path-editor/line-path-form-wrapper/line-path-form-wrapper.component';
import { isModerator } from '../../../../guards/is-moderator';
import { ObjectType } from '../../../../models/object';
import {
  defaultBg,
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
      outletRoute('gallery', GalleryComponent, 'lineContent', {
        data: { objectType: ObjectType.Line },
      }),
      outletRoute('comments', CommentsComponent, 'lineContent', {
        data: { objectType: ObjectType.Line },
      }),
      outletRoute(
        'moderator-tasks',
        ModeratorTaskListComponent,
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
    component: LineFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/topo-images/:topo-image-id/add-line-path',
    component: LinePathFormWrapperComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
];
