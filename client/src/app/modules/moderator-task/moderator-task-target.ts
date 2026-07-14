import { Area } from '../../models/area';
import { Crag } from '../../models/crag';
import { Line } from '../../models/line';
import { ModeratorTask } from '../../models/moderator-task';
import { ObjectType } from '../../models/object';
import { Region } from '../../models/region';
import { Sector } from '../../models/sector';
import { ApiQueryParams } from '../../utility/http/query-params';

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
  params: ApiQueryParams,
  scope: ModeratorTaskScope,
): void => {
  params['scope-type'] = scope.scopeType;
  switch (scope.scopeType) {
    case ObjectType.Crag:
      if (scope.cragSlug) {
        params['crag-slug'] = scope.cragSlug;
      }
      break;
    case ObjectType.Sector:
      if (scope.sectorSlug) {
        params['sector-slug'] = scope.sectorSlug;
      }
      break;
    case ObjectType.Area:
      if (scope.areaSlug) {
        params['area-slug'] = scope.areaSlug;
      }
      break;
    case ObjectType.Line:
      if (scope.lineSlug) {
        params['line-slug'] = scope.lineSlug;
      }
      break;
  }
};

/**
 * Builds query params for `GET /api/moderator-tasks`.
 */
export const buildModeratorTaskListQuery = (
  query: ModeratorTaskListQuery,
): ApiQueryParams => {
  const params: ApiQueryParams = {
    'scope-type': query.scope.scopeType,
    page: query.page,
    per_page: query.perPage ?? 10,
  };
  appendModeratorTaskScopeParams(params, query.scope);
  if (query.assignedToUnassigned) {
    params['assigned-to-unassigned'] = 'true';
  } else if (query.assignedToId) {
    params['assigned-to-id'] = query.assignedToId;
  }
  if (query.createdById) {
    params['created-by-id'] = query.createdById;
  }
  if (query.finishedById) {
    params['finished-by-id'] = query.finishedById;
  }
  return params;
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
