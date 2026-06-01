# Moderator task scope

Moderator tasks are anchored to a single topo node (Region, Crag, Sector, Area, or Line). List endpoints and the Tasks UI use **scope** to decide which tasks appear on a given page: the current node plus everything **under** it in the hierarchy.

Implementation: `server/src/util/moderator_task_scope.py` (`get_scope_pairs`, `filter_tasks_by_scope`).

## Hierarchy

```
Region
  └── Crag
        └── Sector
              └── Area
                    └── Line
```

## What each Tasks tab shows

| View scope | Tasks included |
|------------|----------------|
| Line | Tasks on that line |
| Area | Tasks on the area and its lines |
| Sector | Tasks on the sector, its areas, and their lines |
| Crag | Tasks on the crag and its full subtree |
| Region | Tasks on the region, every crag, and each crag’s full subtree |

Tasks on a parent do **not** appear when viewing a child scope unless the task is actually attached to that child or a descendant. For example, a task on a Sector is visible from Region and Crag lists, but not from a sibling Sector’s tab.

## API

`GET /api/moderator-tasks` requires moderator auth and scope query parameters resolved in `moderator_task_resources._resolve_scope_from_request`:

| Parameter | Required when |
|-----------|----------------|
| `scope-type` | Always (`Region`, `Crag`, `Sector`, `Area`, `Line`) |
| `crag-slug` | All scopes except `Region` |
| `sector-slug` | `Sector`, `Area`, `Line` |
| `area-slug` | `Area`, `Line` |
| `line-slug` | `Line` |

For `scope-type=Region`, the active region comes from `Region.return_it()` (no slug).

Pagination and filters (all optional except scope):

| Parameter | Description |
|-----------|-------------|
| `page` | Page number (default `1`) |
| `per_page` | Page size (default `10`) |
| `assigned-to-id` | Filter by assignee user id |
| `assigned-to-unassigned` | Set to `true` to show only tasks with no assignee |
| `created-by-id` | Filter by creator user id |
| `finished-by-id` | Filter by user who completed the task |

Response shape: `{ "items": [...], "hasNext": boolean }`.

Tasks are ordered with open tasks first, then completed. Open tasks sort by `time_created` (newest first). Completed tasks sort by `time_finished` only (newest completion first).

## Client

The Angular client builds list queries in `client/src/app/utility/moderator-task-target.ts` (`ModeratorTaskScope`, `buildModeratorTaskListQuery`) and loads pages with infinite scroll in `ModeratorTaskListComponent`. Target labels for display use `formatModeratorTaskTarget`; server-side labels for notifications use `util/moderator_task_links.moderator_task_target_label`.
