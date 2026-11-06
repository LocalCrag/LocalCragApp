import { MenuItemPosition } from '../enums/menu-item-position';
import { MenuItemType } from '../enums/menu-item-type';
import { MenuItem } from '../models/menu-item';
import {
  buildMenuItemTree,
  canNestMenuItem,
  descendantIds,
  flattenMenuItemTree,
  nestHeaderMenuItems,
  planMenuItemDrop,
} from './menu-item-tree';

function item(
  id: string,
  orderIndex: number,
  parentId: string = null,
  type: MenuItemType = MenuItemType.URL,
): MenuItem {
  const menuItem = new MenuItem();
  menuItem.id = id;
  menuItem.orderIndex = orderIndex;
  menuItem.parentId = parentId;
  menuItem.position = MenuItemPosition.TOP;
  menuItem.type = type;
  menuItem.title = id;
  return menuItem;
}

describe('menu item tree', () => {
  it('nests children under their parent and keeps sibling order', () => {
    const tree = buildMenuItemTree([
      item('child', 0, 'parent'),
      item('root-b', 2),
      item('parent', 1),
      item('grandchild', 3, 'child'),
    ]);

    expect(tree.map((node) => node.item.id)).toEqual(['parent', 'root-b']);
    expect(tree[0].children.map((node) => node.item.id)).toEqual(['child']);
    expect(tree[0].children[0].children.map((node) => node.item.id)).toEqual([
      'grandchild',
    ]);
    expect(flattenMenuItemTree(tree).map((row) => row.depth)).toEqual([
      0, 1, 2, 0,
    ]);
  });

  it('keeps a missing parent and a cycle visible', () => {
    const missingParent = buildMenuItemTree([item('orphan', 0, 'gone')]);
    expect(missingParent.map((node) => node.item.id)).toEqual(['orphan']);

    const cycle = buildMenuItemTree([item('a', 0, 'b'), item('b', 1, 'a')]);
    expect(flattenMenuItemTree(cycle).map((row) => row.item.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('allows a drop onto another header item and rejects cycles', () => {
    const items = [item('news', 0), item('page', 1), item('child', 2, 'page')];

    expect(canNestMenuItem(items, items[1], items[0])).toBeTrue();
    expect(canNestMenuItem(items, items[0], items[0])).toBeFalse();
    expect(canNestMenuItem(items, items[2], items[1])).toBeFalse();
    expect(canNestMenuItem(items, items[1], items[2])).toBeFalse();

    items[0].position = MenuItemPosition.BOTTOM;
    expect(canNestMenuItem(items, items[1], items[0])).toBeFalse();

    const topo = item('topo', 3, null, MenuItemType.TOPO);
    expect(canNestMenuItem([...items, topo], items[1], topo)).toBeFalse();
  });

  it('lists descendants and stops on a cycle', () => {
    const items = [item('a', 0), item('b', 1, 'a'), item('c', 2, 'b')];
    expect(Array.from(descendantIds(items, 'a'))).toEqual(['b', 'c']);

    const cycle = [item('a', 0, 'b'), item('b', 1, 'a')];
    expect(descendantIds(cycle, 'a').has('a')).toBeTrue();
    expect(descendantIds(cycle, 'a').has('b')).toBeTrue();
  });

  it('reorders header items and nests when dropped inside', () => {
    const items = [item('news', 0), item('topo', 1), item('youtube', 2)];

    expect(planMenuItemDrop(items, 'youtube', 'news', 'before')).toEqual({
      orderedIds: ['youtube', 'news', 'topo'],
      parentId: null,
      parentIds: { youtube: null },
    });
    expect(planMenuItemDrop(items, 'news', 'youtube', 'after')).toEqual({
      orderedIds: ['topo', 'youtube', 'news'],
      parentId: null,
      parentIds: { news: null },
    });
    expect(planMenuItemDrop(items, 'youtube', 'news', 'inside')).toEqual({
      orderedIds: ['news', 'youtube', 'topo'],
      parentId: 'news',
      parentIds: { youtube: 'news' },
    });
    expect(items.map((entry) => entry.parentId ?? null)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('lifts a nested item beside a root and moves a subtree together', () => {
    const items = [item('news', 0), item('child', 1, 'news'), item('topo', 2)];

    expect(planMenuItemDrop(items, 'child', 'topo', 'before')).toEqual({
      orderedIds: ['news', 'child', 'topo'],
      parentId: null,
      parentIds: { child: null },
    });
    expect(
      planMenuItemDrop(items, 'news', 'topo', 'after')?.orderedIds,
    ).toEqual(['topo', 'news', 'child']);
  });

  it('inserts into the gap above nested children instead of the parent level', () => {
    const items = [
      item('a', 0),
      item('b', 1, 'a'),
      item('c', 2, 'a'),
      item('d', 3),
    ];

    expect(planMenuItemDrop(items, 'd', 'a', 'after')).toEqual({
      orderedIds: ['a', 'd', 'b', 'c'],
      parentId: 'a',
      parentIds: { d: 'a' },
    });
    expect(planMenuItemDrop(items, 'd', 'b', 'before')).toEqual({
      orderedIds: ['a', 'd', 'b', 'c'],
      parentId: 'a',
      parentIds: { d: 'a' },
    });
    expect(planMenuItemDrop(items, 'd', 'b', 'after')).toEqual({
      orderedIds: ['a', 'b', 'd', 'c'],
      parentId: 'a',
      parentIds: { d: 'a' },
    });
    expect(items.map((entry) => entry.parentId ?? null)).toEqual([
      null,
      'a',
      'a',
      null,
    ]);
  });

  it('lifts the last nested row out to the end of the list', () => {
    const items = [item('a', 0), item('b', 1, 'a'), item('c', 2, 'a')];

    expect(planMenuItemDrop(items, 'c', 'c', 'after')).toEqual({
      orderedIds: ['a', 'b', 'c'],
      parentId: null,
      parentIds: { c: null },
    });
    expect(planMenuItemDrop(items, 'b', 'c', 'after')).toEqual({
      orderedIds: ['a', 'c', 'b'],
      parentId: null,
      parentIds: { b: null },
    });
    expect(planMenuItemDrop(items, 'b', 'b', 'after')).toBeNull();

    const deep = [item('a', 0), item('b', 1, 'a'), item('c', 2, 'b')];
    expect(planMenuItemDrop(deep, 'c', 'c', 'after')).toEqual({
      orderedIds: ['a', 'b', 'c'],
      parentId: null,
      parentIds: { c: null },
    });
  });

  it('rejects a drop that would make a topo item a parent', () => {
    const topo = item('topo', 0, null, MenuItemType.TOPO);
    const items = [topo, item('news', 1), item('child', 2, 'topo')];

    expect(planMenuItemDrop(items, 'news', 'topo', 'inside')).toBeNull();
    expect(planMenuItemDrop(items, 'news', 'child', 'before')).toBeNull();
    expect(planMenuItemDrop(items, 'topo', 'news', 'before')).toBeNull();
  });

  it('rejects a drop that would nest an item in its own subtree', () => {
    const items = [item('news', 0), item('child', 1, 'news')];

    expect(planMenuItemDrop(items, 'news', 'child', 'inside')).toBeNull();
    expect(planMenuItemDrop(items, 'news', 'child', 'after')).toBeNull();
    expect(planMenuItemDrop(items, 'news', 'news', 'before')).toBeNull();
  });

  it('reorders footer items and never gives them a parent', () => {
    const items = [item('history', 0), item('about', 1), item('links', 2)].map(
      (entry) => {
        entry.position = MenuItemPosition.BOTTOM;
        return entry;
      },
    );

    expect(planMenuItemDrop(items, 'links', 'history', 'before')).toEqual({
      orderedIds: ['links', 'history', 'about'],
      parentId: null,
      parentIds: { links: null },
    });
    expect(planMenuItemDrop(items, 'links', 'history', 'inside')).toBeNull();
  });

  it('puts custom children before the topo crag tree and leaves other items flat', () => {
    const topo = item('topo', 0, null, MenuItemType.TOPO);
    const page = item('page', 1, 'topo', MenuItemType.NEWS);
    const crag = { label: 'Brione', routerLink: '/topo/brione/sectors' };

    const nested = nestHeaderMenuItems(
      [page, topo],
      (menuItem) => ({ label: menuItem.id, routerLink: `/${menuItem.id}` }),
      [crag],
    );

    expect(nested.map((entry) => entry.label)).toEqual(['topo']);
    expect(nested[0].routerLink).toEqual('/topo');
    expect(nested[0].items.map((entry) => entry.label)).toEqual([
      'page',
      'Brione',
    ]);
  });

  it('drops an empty container and keeps one that has children', () => {
    const group = item('group', 0, null, MenuItemType.CONTAINER);
    const child = item('child', 1, 'group');
    const empty = item('empty', 2, null, MenuItemType.CONTAINER);

    const nested = nestHeaderMenuItems(
      [group, child, empty],
      (menuItem) =>
        menuItem.type === MenuItemType.CONTAINER
          ? { label: menuItem.id }
          : { label: menuItem.id, routerLink: `/${menuItem.id}` },
      [],
    );

    expect(nested.map((entry) => entry.label)).toEqual(['group']);
    expect(nested[0].routerLink).toBeUndefined();
    expect(nested[0].items.map((entry) => entry.label)).toEqual(['child']);
  });
});
