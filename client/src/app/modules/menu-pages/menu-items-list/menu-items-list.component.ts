import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '../../../services/core/page-title.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { MenuItem } from '../../../models/menu-item';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { MenuItemPosition } from '../../../enums/menu-item-position';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuItemType } from '../../../enums/menu-item-type';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import { ItemOrder } from '../../../interfaces/item-order.interface';
import {
  buildMenuItemTree,
  flattenMenuItemTree,
  isTrailingNestedItem,
  MenuDropPlacement,
  planMenuItemDrop,
} from '../../../utility/menu-item-tree';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { reloadMenus } from '../../../ngrx/actions/core.actions';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { MenuPagesListSkeletonComponent } from '../menu-list-skeleton/menu-pages-list-skeleton.component';
import { Message } from 'primeng/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-menu-items-list',
  imports: [
    DataViewModule,
    ButtonModule,
    NgClass,
    RouterLink,
    TranslocoDirective,
    TranslocoPipe,
    MenuPagesListSkeletonComponent,
    Message,
  ],
  templateUrl: './menu-items-list.component.html',
  styleUrl: './menu-items-list.component.scss',
  providers: [DialogService],
})
export class MenuItemsListComponent implements OnInit {
  public menuItemsTop: MenuItem[];
  public menuItemsBottom: MenuItem[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public isMobile$: Observable<boolean>;
  public menuItemTypes = MenuItemType;
  public ref: DynamicDialogRef | undefined;
  public positions = MenuItemPosition;
  public isMobile = false;
  /** Item held by the handle. Null when no drag is in progress. */
  public draggedItem: MenuItem | null = null;
  /** Row under the pointer, and which band of that row is the landing. */
  public dropTargetId: string | null = null;
  public dropPlacement: MenuDropPlacement | null = null;
  /** Blocks a second drag while the previous drop is still saving. */
  private savingDrop = false;

  private destroyRef = inject(DestroyRef);
  private menuItemsService = inject(MenuItemsService);
  private dialogService = inject(DialogService);
  private store = inject(Store);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  /**
   * Loads the menu items on initialization.
   */
  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        marker('menuPages.menuPageList.menuItemsListTitle'),
      ),
    );
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.isMobile$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isMobile) => {
        this.isMobile = isMobile;
      });
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('menuItemsListBrowserTitle'))} - ${instanceName}`,
      );
    });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([this.menuItemsService.getMenuItems()]).subscribe(
      ([menuItems]) => {
        this.menuItemsTop = this.withDepth(
          menuItems.filter(
            (menuItem) => menuItem.position === MenuItemPosition.TOP,
          ),
        );
        this.menuItemsBottom = menuItems.filter(
          (menuItem) => menuItem.position === MenuItemPosition.BOTTOM,
        );
        this.loading = LoadingState.DEFAULT;
      },
    );
  }

  /**
   * Desktop drag on the menu editor. Mobile has no handles and keeps the reorder dialog.
   *
   * The handle captures the pointer. The drop is read from clientX/Y through
   * elementFromPoint, including on pointerup, because a drag can land without a pointermove.
   *
   * A header row has three bands. The top 28% inserts before the row, the bottom
   * 28% inserts after it, and the middle nests under it. An invalid nest falls
   * back to the nearer edge. Footer rows only reorder, split in half.
   *
   * planMenuItemDrop decides the parent and the order. The blue line follows
   * those rules: its indent is the landing depth, and a top-level landing spans
   * the row. The before-line and the after-line of the next row share the border
   * between them, so one slot is not drawn in two places.
   */
  onPointerDown(item: MenuItem, event: PointerEvent) {
    if (this.isMobile || this.savingDrop || event.button !== 0) {
      return;
    }
    this.draggedItem = item;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onPointerMove(event: PointerEvent) {
    this.updateDrop(event);
  }

  onPointerUp(event: PointerEvent) {
    this.updateDrop(event);
    const dragged = this.draggedItem;
    const targetId = this.dropTargetId;
    const placement = this.dropPlacement;
    this.endDrag();
    if (!dragged || !targetId || !placement) {
      return;
    }
    this.applyDrop(dragged, targetId, placement);
  }

  /**
   * Points the blue line at the row under the pointer.
   * A header drag that misses a footer row is ignored. The strip just under
   * the list still counts as the last row's bottom edge.
   */
  private updateDrop(event: PointerEvent) {
    if (!this.draggedItem) {
      return;
    }
    const under = document.elementFromPoint(event.clientX, event.clientY);
    let row = under?.closest('[data-menu-item-id]') as HTMLElement | null;
    if (row && !this.sameList(row)) {
      row = null;
    }
    let pointer = event;
    if (!row) {
      const trailing = this.rowJustBelowList(event);
      if (!trailing) {
        this.dropTargetId = null;
        this.dropPlacement = null;
        return;
      }
      row = trailing.row;
      pointer = trailing.pointer;
    }
    const target = this.findItem(row.dataset.menuItemId);
    const placement = target ? this.resolveDrop(row, pointer, target) : null;
    this.dropTargetId = placement ? target.id : null;
    this.dropPlacement = placement;
  }

  endDrag() {
    this.draggedItem = null;
    this.dropTargetId = null;
    this.dropPlacement = null;
  }

  /**
   * The middle of a header row nests. The top and bottom edges reorder.
   * An invalid nest falls back to the nearer edge so the same drag can still sort.
   */
  private resolveDrop(
    row: HTMLElement,
    event: PointerEvent,
    target: MenuItem,
  ): MenuDropPlacement | null {
    const dragged = this.draggedItem;
    if (!dragged) {
      return null;
    }
    const rect = row.getBoundingClientRect();
    const ratio =
      rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
    const list = this.listFor(dragged);
    const nesting =
      dragged.position === MenuItemPosition.TOP &&
      target.position === MenuItemPosition.TOP;
    const edge: MenuDropPlacement = ratio < 0.5 ? 'before' : 'after';
    const candidates: MenuDropPlacement[] = nesting
      ? ratio < 0.28
        ? ['before', 'inside', 'after']
        : ratio > 0.72
          ? ['after', 'inside', 'before']
          : ['inside', edge]
      : [edge];
    return (
      candidates.find((placement) =>
        planMenuItemDrop(list, dragged.id, target.id, placement),
      ) ?? null
    );
  }

  /**
   * Applies the plan immediately, then saves changed parents and, after that,
   * the order of this menu position. A failed save reloads the list.
   */
  private applyDrop(
    dragged: MenuItem,
    targetId: string,
    placement: MenuDropPlacement,
  ) {
    const list = this.listFor(dragged);
    const plan = planMenuItemDrop(list, dragged.id, targetId, placement);
    if (!plan) {
      return;
    }
    const byId = new Map(list.map((item) => [item.id, item]));
    const changedParents = Object.entries(plan.parentIds).filter(
      ([id, parentId]) =>
        (byId.get(id)?.parentId ?? null) !== (parentId ?? null),
    );
    const orderChanged = plan.orderedIds.some(
      (id, index) => list[index]?.id !== id,
    );
    if (changedParents.length === 0 && !orderChanged) {
      return;
    }

    changedParents.forEach(([id, parentId]) => {
      const item = byId.get(id);
      if (item) {
        item.parentId = parentId;
      }
    });
    const ordered = plan.orderedIds
      .map((id) => byId.get(id))
      .filter((item): item is MenuItem => !!item);
    ordered.forEach((item, index) => {
      item.orderIndex = index;
    });
    if (dragged.position === MenuItemPosition.TOP) {
      this.menuItemsTop = this.withDepth(ordered);
    } else {
      this.menuItemsBottom = ordered;
    }

    const order: ItemOrder = {};
    ordered.forEach((item, index) => {
      order[item.id] = index;
    });
    const parentsToSave = changedParents
      .map(([id]) => byId.get(id))
      .filter((item): item is MenuItem => !!item);
    const saveParents =
      parentsToSave.length > 0
        ? forkJoin(
            parentsToSave.map((item) =>
              this.menuItemsService.updateMenuItem(this.copyForSave(item)),
            ),
          )
        : of(null);
    const saveOrder = orderChanged
      ? dragged.position === MenuItemPosition.TOP
        ? this.menuItemsService.updateMenuItemOrderTop(order)
        : this.menuItemsService.updateMenuItemOrderBottom(order)
      : of(null);

    this.savingDrop = true;
    saveParents.pipe(switchMap(() => saveOrder)).subscribe({
      next: () => {
        this.savingDrop = false;
        this.store.dispatch(reloadMenus());
      },
      error: () => {
        this.savingDrop = false;
        this.refreshData();
      },
    });
  }

  private copyForSave(source: MenuItem): MenuItem {
    const menuItem = new MenuItem();
    menuItem.id = source.id;
    menuItem.type = source.type;
    menuItem.position = source.position;
    menuItem.menuPage = source.menuPage;
    menuItem.icon = source.icon;
    menuItem.url = source.url;
    menuItem.title = source.title;
    menuItem.parentId = source.parentId;
    return menuItem;
  }

  /**
   * Indent of the blue line, in rem. Matches the row padding: 1.5rem plus
   * 1.5rem per landing depth. A sibling uses the target row's depth. A nest,
   * and the bottom edge of a row that already has children, uses one level more.
   */
  dropLineIndent(item: MenuItem): number {
    const depth = item.depth || 0;
    const landing = this.landsAsChild(item) ? depth + 1 : depth;
    return 1.5 + landing * 1.5;
  }

  /**
   * A top-level landing spans the row. A nested landing stays indented.
   * The bottom of a nested row that ends the list is a top-level landing:
   * it unnests the item and places it last.
   */
  isFullWidthDrop(item: MenuItem): boolean {
    if (
      this.dropPlacement === 'after' &&
      isTrailingNestedItem(this.listFor(item) ?? [], item.id)
    ) {
      return true;
    }
    return !this.landsAsChild(item) && !(item.depth || 0);
  }

  private sameList(row: HTMLElement): boolean {
    const item = this.findItem(row.dataset.menuItemId);
    return !!item && item.position === this.draggedItem?.position;
  }

  /**
   * The space under the last row is still that row's bottom edge.
   * A nested item ending the list can be dropped there to leave the nest.
   */
  private rowJustBelowList(
    event: PointerEvent,
  ): { row: HTMLElement; pointer: PointerEvent } | null {
    const dragged = this.draggedItem;
    if (!dragged) {
      return null;
    }
    const last = this.listFor(dragged).at(-1);
    const row = last
      ? (document.querySelector(
          `[data-menu-item-id="${last.id}"]`,
        ) as HTMLElement | null)
      : null;
    if (!row) {
      return null;
    }
    const rect = row.getBoundingClientRect();
    const within =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.bottom &&
      event.clientY <= rect.bottom + 40;
    if (!within) {
      return null;
    }
    return {
      row,
      pointer: new PointerEvent('pointermove', {
        clientX: event.clientX,
        clientY: rect.bottom - 1,
      }),
    };
  }

  /**
   * The mark is one level deeper than the target row when nesting into it,
   * or when the bottom edge inserts as that row's first child.
   */
  private landsAsChild(item: MenuItem): boolean {
    if (this.dropPlacement === 'inside') {
      return true;
    }
    return (
      this.dropPlacement === 'after' &&
      this.listFor(item)?.some((other) => other.parentId === item.id)
    );
  }

  private listFor(item: MenuItem): MenuItem[] {
    return item.position === MenuItemPosition.TOP
      ? this.menuItemsTop
      : this.menuItemsBottom;
  }

  private findItem(id: string | undefined): MenuItem | null {
    if (!id) {
      return null;
    }
    return (
      this.menuItemsTop?.find((item) => item.id === id) ??
      this.menuItemsBottom?.find((item) => item.id === id) ??
      null
    );
  }

  private withDepth(items: MenuItem[]): MenuItem[] {
    return flattenMenuItemTree(buildMenuItemTree(items)).map((row) => {
      row.item.depth = row.depth;
      return row.item;
    });
  }

  reorderMenuItems(position: MenuItemPosition) {
    let data: any;
    if (position === MenuItemPosition.TOP) {
      data = {
        items: this.menuItemsTop,
        itemsName: this.translocoService.translate(
          marker('reorderMenuItemsTopDialogItemsName'),
        ),
        callback: this.menuItemsService.updateMenuItemOrderTop.bind(
          this.menuItemsService,
        ),
        showMenuItemTitle: true,
      };
    }
    if (position === MenuItemPosition.BOTTOM) {
      data = {
        items: this.menuItemsBottom,
        itemsName: this.translocoService.translate(
          marker('reorderMenuItemsBottomDialogItemsName'),
        ),
        callback: this.menuItemsService.updateMenuItemOrderBottom.bind(
          this.menuItemsService,
        ),
        showMenuItemTitle: true,
      };
    }
    this.ref = this.dialogService.open(OrderItemsComponent, {
      modal: true,
      header: this.translocoService.translate(
        marker('reorderMenuItemsDialogTitle'),
      ),
      data,
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshData();
      this.store.dispatch(reloadMenus());
    });
  }
}
