import { Line } from '../../models/line';
import { TopoHierarchyBreadcrumbNode } from '../shared/components/topo-hierarchy-breadcrumbs/topo-hierarchy-breadcrumbs.component';

export interface LineHistoryLocation {
  crag: TopoHierarchyBreadcrumbNode | null;
  sector: TopoHierarchyBreadcrumbNode | null;
  area: TopoHierarchyBreadcrumbNode | null;
}

function breadcrumbNode(
  node: { name?: string | null; slug?: string | null } | null | undefined,
): TopoHierarchyBreadcrumbNode | null {
  if (!node?.name || !node.slug) {
    return null;
  }
  return { name: node.name, slug: node.slug };
}

/**
 * Location shown on a line changelog entry.
 * History payloads nest sector and crag under the area (search schema).
 */
export function lineHistoryLocation(
  line: Line | null | undefined,
): LineHistoryLocation | null {
  const area = breadcrumbNode(line?.area);
  if (!area || !line) {
    return null;
  }
  const sector = line.area?.sector ?? line.sector;
  const crag = sector?.crag ?? line.crag;
  return {
    area,
    sector: breadcrumbNode(sector),
    crag: breadcrumbNode(crag),
  };
}
