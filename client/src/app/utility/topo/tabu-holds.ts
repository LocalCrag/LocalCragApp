import { polygonRingSelfIntersects } from '../geometry/polygon-self-intersection';

export const MIN_TABU_POLYGON_VALUES = 6;

export const TABU_HOLD_FILL = 'rgba(198, 40, 40, 0.35)';
export const TABU_HOLD_STROKE = '#c62828';
export const TABU_HOLD_UNASSIGNED_OPACITY = 0.35;

export interface TabuArea {
  id: string;
  path: number[];
}

export function isCompleteTabuPolygon(
  polygon: number[] | null | undefined,
): boolean {
  return (
    Array.isArray(polygon) &&
    polygon.length >= MIN_TABU_POLYGON_VALUES &&
    polygon.length % 2 === 0
  );
}

export function tabuPolygonVertices(
  polygon: number[] | null | undefined,
): number[][] {
  const vertices: number[][] = [];
  if (!Array.isArray(polygon)) {
    return vertices;
  }
  for (let i = 0; i + 1 < polygon.length; i += 2) {
    vertices.push([polygon[i], polygon[i + 1]]);
  }
  return vertices;
}

/** True if closing the polygon would produce crossing edges. */
export function tabuPolygonHasKinks(
  polygon: number[] | null | undefined,
): boolean {
  return polygonRingSelfIntersects(tabuPolygonVertices(polygon));
}

export function cloneTabuHolds(
  tabuHolds: number[][] | null | undefined,
): number[][] {
  return (tabuHolds ?? []).map((polygon) => [...polygon]);
}

export function tabuPolygonEqual(
  left: number[] | null | undefined,
  right: number[] | null | undefined,
): boolean {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

export function createTabuArea(path: number[], id?: string): TabuArea {
  return {
    id: id ?? globalThis.crypto?.randomUUID?.() ?? `tabu-${Date.now()}`,
    path: [...path],
  };
}

export function cloneTabuAreas(
  areas: TabuArea[] | null | undefined,
): TabuArea[] {
  return (areas ?? []).map((area) => ({
    id: area.id,
    path: [...(area.path ?? [])],
  }));
}

export function deserializeTabuAreas(payload: unknown): TabuArea[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .filter(
      (area): area is { id: string; path: number[] } =>
        !!area &&
        typeof area === 'object' &&
        typeof (area as TabuArea).id === 'string' &&
        Array.isArray((area as TabuArea).path),
    )
    .map((area) => ({ id: area.id, path: [...area.path] }));
}

export function tabuAreasEqual(
  left: TabuArea[] | null | undefined,
  right: TabuArea[] | null | undefined,
): boolean {
  return (
    JSON.stringify(cloneTabuAreas(left)) ===
    JSON.stringify(cloneTabuAreas(right))
  );
}

export function cloneTabuAreaIds(ids: string[] | null | undefined): string[] {
  return [...(ids ?? [])].filter(
    (id) => typeof id === 'string' && id.length > 0,
  );
}

export function tabuAreaIdsEqual(
  left: string[] | null | undefined,
  right: string[] | null | undefined,
): boolean {
  return (
    JSON.stringify(cloneTabuAreaIds(left)) ===
    JSON.stringify(cloneTabuAreaIds(right))
  );
}

export function resolveTabuPolygons(
  ids: string[] | null | undefined,
  areas: TabuArea[] | null | undefined,
): number[][] {
  const byId = new Map((areas ?? []).map((area) => [area.id, area]));
  return cloneTabuAreaIds(ids)
    .map((id) => byId.get(id)?.path)
    .filter((path): path is number[] => Array.isArray(path))
    .map((path) => [...path]);
}

export function subtractTabuAreas(
  all: TabuArea[] | null | undefined,
  assignedIds: string[] | null | undefined,
): TabuArea[] {
  const assigned = new Set(cloneTabuAreaIds(assignedIds));
  return cloneTabuAreas(all).filter((area) => !assigned.has(area.id));
}
