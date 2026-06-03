import { environment } from '../../environments/environment';
import type { Area } from './area';
import type { Crag } from './crag';
import type { Line } from './line';
import type { Sector } from './sector';

function isSkippedSlug(slug: string | null | undefined): boolean {
  return slug === environment.skippedSlug;
}

/** Crag list/detail link; null for placeholder default crags. */
export function topoCragRouterLink(
  crag: Crag | null | undefined,
): string | null {
  if (!crag?.slug || isSkippedSlug(crag.slug)) {
    return null;
  }
  return `/topo/${crag.slug}`;
}

/** Sector link; null when sector, crag, or slugs are missing or placeholder. */
export function topoSectorRouterLink(
  sector: Sector | null | undefined,
): string | null {
  if (!sector?.slug || isSkippedSlug(sector.slug)) {
    return null;
  }
  const cragSlug = sector.crag?.slug;
  if (!cragSlug) {
    return null;
  }
  return `/topo/${cragSlug}/${sector.slug}`;
}

/** Area link; null when area hierarchy is incomplete. */
export function topoAreaRouterLink(
  area: Area | null | undefined,
): string | null {
  if (!area?.slug) {
    return null;
  }
  const sector = area.sector;
  const cragSlug = sector?.crag?.slug;
  if (!sector?.slug || !cragSlug) {
    return null;
  }
  return `/topo/${cragSlug}/${sector.slug}/${area.slug}`;
}

/** Line link; null when line hierarchy is incomplete. */
export function topoLineRouterLink(
  line: Line | null | undefined,
): string | null {
  if (!line?.slug) {
    return null;
  }
  const area = line.area;
  const sector = area?.sector;
  const cragSlug = sector?.crag?.slug;
  if (!area?.slug || !sector?.slug || !cragSlug) {
    return null;
  }
  return `/topo/${cragSlug}/${sector.slug}/${area.slug}/${line.slug}`;
}
