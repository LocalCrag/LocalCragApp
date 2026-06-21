import { Routes } from '@angular/router';
import { topoRegionRoute } from './region.routes';
import { topoRegionFormRoutes } from './region-form.routes';
import { topoCragRoutes } from './crag.routes';
import { topoSectorRoutes } from './sector.routes';
import { topoAreaRoutes } from './area.routes';
import { topoLineRoutes } from './line.routes';

/** Topo routes in match order — do not reorder without checking Angular route precedence. */
export const topoRoutes: Routes = [
  ...topoRegionRoute,
  ...topoRegionFormRoutes,
  ...topoCragRoutes,
  ...topoSectorRoutes,
  ...topoAreaRoutes,
  ...topoLineRoutes,
];
