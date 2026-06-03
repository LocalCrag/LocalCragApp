import { Area } from '../../models/area';
import { Crag } from '../../models/crag';
import { Line } from '../../models/line';
import { ModeratorTask } from '../../models/moderator-task';
import { ObjectType } from '../../models/object';
import { Region } from '../../models/region';
import { Sector } from '../../models/sector';

/**
 * Query parameters for `GET /api/moderator-tasks` at the current topo page.
 *
 * Typically built from route params in `ModeratorTaskListComponent.resolveScope`.
 */
export interface ModeratorTaskScope {
  /** Topo level of the Tasks tab (Region … Line). */
  scopeType: ObjectType;
  /** Sent for Crag scope only. */
  cragSlug?: string;
  /** Sent for Sector scope only. */
  sectorSlug?: string;
  /** Sent for Area scope only. */
  areaSlug?: string;
  /** Sent for Line scope only. */
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

const appendModeratorTaskScopeParams = (
  params: URLSearchParams,
  scope: ModeratorTaskScope,
): void => {
  params.set('scope-type', scope.scopeType);
  switch (scope.scopeType) {
    case ObjectType.Crag:
      if (scope.cragSlug) {
        params.set('crag-slug', scope.cragSlug);
      }
      break;
    case ObjectType.Sector:
      if (scope.sectorSlug) {
        params.set('sector-slug', scope.sectorSlug);
      }
      break;
    case ObjectType.Area:
      if (scope.areaSlug) {
        params.set('area-slug', scope.areaSlug);
      }
      break;
    case ObjectType.Line:
      if (scope.lineSlug) {
        params.set('line-slug', scope.lineSlug);
      }
      break;
  }
};

/**
 * Builds the query string appended to `GET /api/moderator-tasks`.
 *
 * Example: `?scope-type=Line&line-slug=example-line&page=1&per_page=10`
 */
export const buildModeratorTaskListQuery = (
  query: ModeratorTaskListQuery,
): string => {
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
};

const entityLink = (entity: {
  name: string;
  routerLink: string | null;
}): ModeratorTaskTargetLink | null => {
  if (!entity.routerLink) {
    return null;
  }
  return { name: entity.name, routerLink: entity.routerLink };
};

const appendLink = (
  links: ModeratorTaskTargetLink[],
  link: ModeratorTaskTargetLink | null,
): void => {
  if (link) {
    links.push(link);
  }
};

/**
 * Comma-separated clickable breadcrumb for the topo node a task is attached to.
 *
 * Uses `routerLink` from Crag, Sector, Area, and Line models (set in deserialize).
 * Returns an empty array when `task.object` is not loaded.
 */
const prependRegionLink = (
  links: ModeratorTaskTargetLink[],
  region: Region | null | undefined,
  task: ModeratorTask,
): ModeratorTaskTargetLink[] => {
  if (task.objectType === ObjectType.Region || !region) {
    return links;
  }
  return [{ name: region.name, routerLink: '/topo' }, ...links];
};

export const getModeratorTaskTargetLinks = (
  task: ModeratorTask,
  region?: Region | null,
): ModeratorTaskTargetLink[] => {
  const target = task.object;
  if (!target) {
    return [];
  }

  if (task.objectType === ObjectType.Region && target instanceof Region) {
    return [{ name: target.name, routerLink: '/topo' }];
  }

  if (task.objectType === ObjectType.Crag && target instanceof Crag) {
    const link = entityLink(target);
    return prependRegionLink(link ? [link] : [], region, task);
  }

  if (task.objectType === ObjectType.Sector && target instanceof Sector) {
    const links: ModeratorTaskTargetLink[] = [];
    appendLink(links, target.crag ? entityLink(target.crag) : null);
    appendLink(links, entityLink(target));
    return prependRegionLink(links, region, task);
  }

  if (task.objectType === ObjectType.Area && target instanceof Area) {
    const links: ModeratorTaskTargetLink[] = [];
    appendLink(
      links,
      target.sector?.crag ? entityLink(target.sector.crag) : null,
    );
    appendLink(links, target.sector ? entityLink(target.sector) : null);
    appendLink(links, entityLink(target));
    return prependRegionLink(links, region, task);
  }

  if (task.objectType === ObjectType.Line && target instanceof Line) {
    const area = target.area;
    const links: ModeratorTaskTargetLink[] = [];
    appendLink(links, area?.sector?.crag ? entityLink(area.sector.crag) : null);
    appendLink(links, area?.sector ? entityLink(area.sector) : null);
    appendLink(links, area ? entityLink(area) : null);
    appendLink(links, entityLink(target));
    return prependRegionLink(links, region, task);
  }

  return [];
};
