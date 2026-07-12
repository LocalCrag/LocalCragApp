import { Routes } from '@angular/router';
import { isModerator } from '../../../../guards/is-moderator';
import { skipHierarchy } from '../../../../guards/skip-hierarchy';
import { environment } from '../../../../../environments/environment';
import { ObjectType } from '../../../../models/object';
import { moderatorTaskFormRoutes } from '../route-helpers';

export const topoRegionFormRoutes: Routes = [
  ...moderatorTaskFormRoutes('topo', ObjectType.Region),
  {
    path: 'topo/edit-region',
    loadComponent: () =>
      import('../../../region/region-form/region-form.component').then(
        (m) => m.RegionFormComponent,
      ),
    canActivate: [isModerator, skipHierarchy(1, ['/topo'], ['edit'])],
  },
  {
    path: 'topo/create-crag',
    loadComponent: () =>
      import('../../../crag/crag-form/crag-form.component').then(
        (m) => m.CragFormComponent,
      ),
    canActivate: [
      isModerator,
      skipHierarchy(
        1,
        ['/topo', environment.skippedSlug],
        ['create-sector'],
        false,
      ),
    ],
  },
];
