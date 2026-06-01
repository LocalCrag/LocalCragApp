import { Area } from '../models/area';
import { Crag } from '../models/crag';
import { Line } from '../models/line';
import { ModeratorTask } from '../models/moderator-task';
import { ObjectType } from '../models/object';
import { Region } from '../models/region';
import { Sector } from '../models/sector';

/**
 * Query parameters for `GET /api/moderator-tasks` at the current topo page.
 *
 * Typically built from route params in `ModeratorTaskListComponent.resolveScope`.
 */
export interface ModeratorTaskScope {
  /** Topo level of the Tasks tab (Region … Line). */
  scopeType: ObjectType;
  /** Required for Crag and below. */
  cragSlug?: string;
  /** Required for Sector and below. */
  sectorSlug?: string;
  /** Required for Area and below. */
  areaSlug?: string;
  /** Required for Line scope. */
  lineSlug?: string;
}

/** Clickable topo breadcrumb segment for a task's anchor node. */
export interface ModeratorTaskTargetLink {
  name: string;
  routerLink: string;
}

/** Assignee filter value for tasks with no assignee. */
export const ASSIGNEE_FILTER_UNASSIGNED = '__unassigned__';

/** Optional list filters and pagination for `GET /api/moderator-tasks`. */
export interface ModeratorTaskListQuery {
  scope: ModeratorTaskScope;
  page: number;
  perPage?: number;
  assignedToId?: string | null;
  assignedToUnassigned?: boolean;
  createdById?: string | null;
  finishedById?: string | null;
}

function appendModeratorTaskScopeParams(
  params: URLSearchParams,
  scope: ModeratorTaskScope,
): void {
  params.set('scope-type', scope.scopeType);
  if (scope.cragSlug) {
    params.set('crag-slug', scope.cragSlug);
  }
  if (scope.sectorSlug) {
    params.set('sector-slug', scope.sectorSlug);
  }
  if (scope.areaSlug) {
    params.set('area-slug', scope.areaSlug);
  }
  if (scope.lineSlug) {
    params.set('line-slug', scope.lineSlug);
  }
}

/**
 * Builds the query string appended to `GET /api/moderator-tasks`.
 *
 * Example: `?scope-type=Crag&crag-slug=example-crag&page=1&per_page=10`
 */
export function buildModeratorTaskListQuery(
  query: ModeratorTaskListQuery,
): string {
  const params = new URLSearchParams();
  appendModeratorTaskScopeParams(params, query.scope);
  params.set('page', String(query.page));
  params.set('per_page', String(query.perPage ?? 10));
  if (query.assignedToUnassigned) {
    params.set('assigned-to-unassigned', 'true');
  } else if (query.assignedToId) {
    params.set('assigned-to-id', query.assignedToId);
  }
  if (query.createdById) {
    params.set('created-by-id', query.createdById);
  }
  if (query.finishedById) {
    params.set('finished-by-id', query.finishedById);
  }
  return `?${params.toString()}`;
}

function entityLink(entity: {
  name: string;
  routerLink: string | null;
}): ModeratorTaskTargetLink | null {
  if (!entity.routerLink) {
    return null;
  }
  return { name: entity.name, routerLink: entity.routerLink };
}

function appendLink(
  links: ModeratorTaskTargetLink[],
  link: ModeratorTaskTargetLink | null,
): void {
  if (link) {
    links.push(link);
  }
}

/**
 * Comma-separated clickable breadcrumb for the topo node a task is attached to.
 *
 * Uses `routerLink` from Crag, Sector, Area, and Line models (set in deserialize).
 * Returns an empty array when `task.object` is not loaded.
 */
export function getModeratorTaskTargetLinks(
  task: ModeratorTask,
): ModeratorTaskTargetLink[] {
  const target = task.object;
  if (!target) {
    return [];
  }

  if (task.objectType === ObjectType.Region && target instanceof Region) {
    return [{ name: target.name, routerLink: '/topo' }];
  }

  if (task.objectType === ObjectType.Crag && target instanceof Crag) {
    const link = entityLink(target);
    return link ? [link] : [];
  }

  if (task.objectType === ObjectType.Sector && target instanceof Sector) {
    const links: ModeratorTaskTargetLink[] = [];
    appendLink(links, target.crag ? entityLink(target.crag) : null);
    appendLink(links, entityLink(target));
    return links;
  }

  if (task.objectType === ObjectType.Area && target instanceof Area) {
    const links: ModeratorTaskTargetLink[] = [];
    appendLink(
      links,
      target.sector?.crag ? entityLink(target.sector.crag) : null,
    );
    appendLink(links, target.sector ? entityLink(target.sector) : null);
    appendLink(links, entityLink(target));
    return links;
  }

  if (task.objectType === ObjectType.Line && target instanceof Line) {
    const area = target.area;
    const links: ModeratorTaskTargetLink[] = [];
    appendLink(links, area?.sector?.crag ? entityLink(area.sector.crag) : null);
    appendLink(links, area?.sector ? entityLink(area.sector) : null);
    appendLink(links, area ? entityLink(area) : null);
    appendLink(links, entityLink(target));
    return links;
  }

  return [];
}

/** Comma-separated plain-text breadcrumb (same segments as `getModeratorTaskTargetLinks`). */
export function formatModeratorTaskTarget(task: ModeratorTask): string {
  return getModeratorTaskTargetLinks(task)
    .map((link) => link.name)
    .join(', ');
}
