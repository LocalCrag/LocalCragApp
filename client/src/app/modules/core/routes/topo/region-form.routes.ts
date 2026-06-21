import { Routes } from '@angular/router';
import { RegionFormComponent } from '../../../region/region-form/region-form.component';
import { CragFormComponent } from '../../../crag/crag-form/crag-form.component';
import { isModerator } from '../../../../guards/is-moderator';
import { skipHierarchy } from '../../../../guards/skip-hierarchy';
import { environment } from '../../../../../environments/environment';
import { ObjectType } from '../../../../models/object';
import { defaultBg, moderatorTaskFormRoutes } from '../route-helpers';

export const topoRegionFormRoutes: Routes = [
  ...moderatorTaskFormRoutes('topo', ObjectType.Region),
  {
    path: 'topo/edit-region',
    component: RegionFormComponent,
    canActivate: [isModerator, skipHierarchy(1, ['/topo'], ['edit'])],
    data: defaultBg(),
  },
  {
    path: 'topo/create-crag',
    component: CragFormComponent,
    canActivate: [
      isModerator,
      skipHierarchy(
        1,
        ['/topo', environment.skippedSlug],
        ['create-sector'],
        false,
      ),
    ],
    data: defaultBg(),
  },
];
