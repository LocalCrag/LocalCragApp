import { MenuItem as PrimeMenuItem } from 'primeng/api';
import { MenuItemPosition } from '../enums/menu-item-position';
import { MenuItemType } from '../enums/menu-item-type';
import { MenuItem } from '../models/menu-item';

export interface MenuItemNode {
  item: MenuItem;
  depth: number;
  children: MenuItemNode[];
}

/**
 * Builds a tree from a flat menu-item list.
 * Items whose parent is missing, and items stuck in a cycle, stay visible at the root.
 */
export function buildMenuItemTree(items: MenuItem[]): MenuItemNode[] {
  const sorted = [...items].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );
  const ids = new Set(sorted.map((item) => item.id));
  const childrenOf = new Map<string | null, MenuItem[]>();

  for (const item of sorted) {
    const parentId =
      item.parentId && ids.has(item.parentId) ? item.parentId : null;
    const siblings = childrenOf.get(parentId) ?? [];
    siblings.push(item);
    childrenOf.set(parentId, siblings);
  }

  const visited = new Set<string>();
  const visit = (item: MenuItem, depth: number): MenuItemNode => {
    visited.add(item.id);
    const children = (childrenOf.get(item.id) ?? [])
      .filter((child) => !visited.has(child.id))
      .map((child) => visit(child, depth + 1));
    return { item, depth, children };
  };

  const roots = (childrenOf.get(null) ?? []).map((item) => visit(item, 0));
  for (const item of sorted) {
    if (!visited.has(item.id)) {
      roots.push(visit(item, 0));
    }
  }
  return roots;
}

export function flattenMenuItemTree(
  nodes: MenuItemNode[],
): { item: MenuItem; depth: number }[] {
  const rows: { item: MenuItem; depth: number }[] = [];
  const walk = (node: MenuItemNode) => {
    rows.push({ item: node.item, depth: node.depth });
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return rows;
}

/**
 * A header item can be dropped onto another header item to nest under it.
 * The target cannot be the item itself, its current parent, one of its descendants, or a topo item.
 * Topo items open the crag tree and cannot have custom children.
 */
export function canNestMenuItem(
  items: MenuItem[],
  dragged: MenuItem | null,
  parent: MenuItem | null,
): boolean {
  if (!dragged?.id || !parent?.id || dragged.id === parent.id) {
    return false;
  }
  if (dragged.parentId === parent.id) {
    return false;
  }
  if (parent.type === MenuItemType.TOPO) {
    return false;
  }
  if (
    dragged.position !== MenuItemPosition.TOP ||
    parent.position !== MenuItemPosition.TOP
  ) {
    return false;
  }
  return !descendantIds(items, dragged.id).has(parent.id);
}

export type MenuDropPlacement = 'before' | 'inside' | 'after';

export interface MenuDropPlan {
  orderedIds: string[];
  /** New parent of the dragged item. */
  parentId: string | null;
  /** New parent for every item this drop re-parents, including the dragged item. */
  parentIds: { [id: string]: string | null };
}

/**
 * Plans a desktop drag on the menu editor. The list component chooses the
 * placement from the pointer; this function decides whether that placement
 * is valid and where the item then sits.
 *
 * Header:
 * - before a row, or after a childless row: sibling of the target, same parent.
 * - after a row that has children: first child of that row. The gap above
 *   those children is not also a drop at the parent's level.
 * - inside: last child of the target. A topo item cannot be a parent.
 * - after the last row, when that row is nested: last top-level item.
 *   Dropping a row on itself is allowed only in this case.
 *
 * Footer items only reorder. A drop that changes nothing, or that would
 * cycle, returns null so the list draws no line.
 */
export function planMenuItemDrop(
  items: MenuItem[],
  draggedId: string,
  targetId: string,
  placement: MenuDropPlacement,
): MenuDropPlan | null {
  if (!draggedId || !targetId) {
    return null;
  }
  const dragged = items.find((item) => item.id === draggedId);
  const target = items.find((item) => item.id === targetId);
  if (!dragged || !target || dragged.position !== target.position) {
    return null;
  }

  if (dragged.position !== MenuItemPosition.TOP) {
    if (placement === 'inside' || dragged.id === target.id) {
      return null;
    }
    const ordered = items.filter((item) => item.id !== dragged.id);
    const index = ordered.findIndex((item) => item.id === target.id);
    if (index < 0) {
      return null;
    }
    ordered.splice(placement === 'before' ? index : index + 1, 0, dragged);
    return {
      orderedIds: ordered.map((item) => item.id),
      parentId: null,
      parentIds: { [dragged.id]: null },
    };
  }

  const liftsToEnd =
    placement === 'after' && isTrailingNestedItem(items, target.id);
  if (dragged.id === target.id && !liftsToEnd) {
    return null;
  }

  const descendants = descendantIds(items, dragged.id);
  let parentId: string | null = null;
  if (liftsToEnd) {
    parentId = null;
  } else if (placement === 'inside') {
    if (!canNestMenuItem(items, dragged, target)) {
      return null;
    }
    parentId = target.id;
  } else {
    parentId =
      target.parentId && items.some((item) => item.id === target.parentId)
        ? target.parentId
        : null;
    if (parentId === dragged.id || (parentId && descendants.has(parentId))) {
      return null;
    }
    const parentItem = items.find((item) => item.id === parentId);
    if (parentItem?.type === MenuItemType.TOPO) {
      return null;
    }
  }

  const insertsAsFirstChild =
    !liftsToEnd &&
    placement === 'after' &&
    items.some((item) => item.parentId === target.id);
  if (
    insertsAsFirstChild &&
    (target.type === MenuItemType.TOPO || descendants.has(target.id))
  ) {
    return null;
  }
  if (insertsAsFirstChild) {
    parentId = target.id;
  }

  const tree = buildMenuItemTree(items);
  const beforeIds = flattenMenuItemTree(tree).map((row) => row.item.id);
  const removed = detachNode(tree, dragged.id);
  if (!removed) {
    return null;
  }

  if (liftsToEnd) {
    tree.push(removed);
    parentId = null;
  } else if (placement === 'inside') {
    const parentNode = findNode(tree, target.id);
    if (!parentNode) {
      return null;
    }
    parentNode.children.push(removed);
  } else if (insertsAsFirstChild) {
    const targetNode = findNode(tree, target.id);
    if (!targetNode) {
      return null;
    }
    targetNode.children.unshift(removed);
  } else {
    const location = findSiblings(tree, target.id, null);
    if (!location) {
      return null;
    }
    location.siblings.splice(
      placement === 'before' ? location.index : location.index + 1,
      0,
      removed,
    );
    parentId = location.parentId;
  }

  const orderedIds = flattenMenuItemTree(tree).map((row) => row.item.id);
  const unchanged =
    (dragged.parentId ?? null) === parentId &&
    orderedIds.every((id, index) => beforeIds[index] === id);
  if (unchanged) {
    return null;
  }

  const parentIds: { [id: string]: string | null } = {
    [dragged.id]: parentId,
  };

  return {
    orderedIds,
    parentId,
    parentIds,
  };
}

/** The last visible header row, when it still has a parent. */
export function isTrailingNestedItem(
  items: MenuItem[],
  targetId: string,
): boolean {
  const rows = flattenMenuItemTree(buildMenuItemTree(items));
  const last = rows[rows.length - 1];
  return !!last && last.item.id === targetId && last.depth > 0;
}

function detachNode(nodes: MenuItemNode[], id: string): MenuItemNode | null {
  const index = nodes.findIndex((node) => node.item.id === id);
  if (index >= 0) {
    return nodes.splice(index, 1)[0];
  }
  for (const node of nodes) {
    const found = detachNode(node.children, id);
    if (found) {
      return found;
    }
  }
  return null;
}

function findNode(nodes: MenuItemNode[], id: string): MenuItemNode | null {
  for (const node of nodes) {
    if (node.item.id === id) {
      return node;
    }
    const found = findNode(node.children, id);
    if (found) {
      return found;
    }
  }
  return null;
}

function findSiblings(
  nodes: MenuItemNode[],
  id: string,
  parentId: string | null,
): { siblings: MenuItemNode[]; index: number; parentId: string | null } | null {
  const index = nodes.findIndex((node) => node.item.id === id);
  if (index >= 0) {
    return { siblings: nodes, index, parentId };
  }
  for (const node of nodes) {
    const found = findSiblings(node.children, id, node.item.id);
    if (found) {
      return found;
    }
  }
  return null;
}

/** Ids of items nested under rootId, not including rootId. Cycles stop. */
export function descendantIds(items: MenuItem[], rootId: string): Set<string> {
  const ids = new Set<string>();
  const walk = (id: string) => {
    for (const item of items) {
      if (item.parentId === id && item.id && !ids.has(item.id)) {
        ids.add(item.id);
        walk(item.id);
      }
    }
  };
  walk(rootId);
  return ids;
}

/**
 * Nests header menu items for the menubar.
 * Topo items keep the crag tree after their custom children.
 * A container is only a label for its children, so an empty one is left out.
 * Footer items are not passed in: the footer stays a flat list.
 */
export function nestHeaderMenuItems(
  items: MenuItem[],
  toItem: (item: MenuItem) => PrimeMenuItem,
  cragItems: PrimeMenuItem[],
): PrimeMenuItem[] {
  const attach = (node: MenuItemNode): PrimeMenuItem | null => {
    const children = node.children
      .map(attach)
      .filter((child): child is PrimeMenuItem => child !== null);
    if (node.item.type === MenuItemType.CONTAINER && children.length === 0) {
      return null;
    }
    const prime = toItem(node.item);
    if (node.item.type === MenuItemType.TOPO) {
      prime.items = [...children, ...cragItems];
    } else if (children.length > 0) {
      prime.items = children;
    }
    return prime;
  };
  return buildMenuItemTree(items)
    .map(attach)
    .filter((item): item is PrimeMenuItem => item !== null);
}
