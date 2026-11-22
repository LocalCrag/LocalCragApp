import { CdkObserveContent } from '@angular/cdk/observers';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  type ElementRef,
  input,
  viewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import {
  type BrnPaginatedTabHeaderItem,
  BrnTabsPaginatedList,
  BrnTabsTrigger,
} from '@spartan-ng/brain/tabs';
import { buttonVariants } from '@spartan-ng/helm/button';
import { classes, hlm } from '@spartan-ng/helm/utils';
import type { ClassValue } from 'clsx';
import type { Observable } from 'rxjs';
import { listVariants } from './hlm-tabs-list';

/**
 * Travel that still counts as a tap. A finger almost always moves a few pixels;
 * treating that as a drag swallows the click, so the tab never activates.
 */
const mouseDragSlop = 8;
const touchDragSlop = 18;

@Component({
  selector: 'hlm-paginated-tabs-list',
  exportAs: 'hlmTabsPaginatedList',
  imports: [CdkObserveContent, NgIcon],
  providers: [provideIcons({ lucideChevronRight, lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'tabs-paginated-list',
  },
  template: `
    <button
      #previousPaginator
      data-pagination="previous"
      type="button"
      aria-hidden="true"
      tabindex="-1"
      [class]="_paginationButtonClass(disableScrollBefore)"
      [disabled]="disableScrollBefore || null"
      (click)="_handlePaginatorClick('before')"
      (mousedown)="onPaginatorPress('before', $event)"
      (mouseup)="_stopInterval()"
      (touchend)="_stopInterval()"
    >
      <ng-icon name="lucideChevronLeft" />
    </button>

    <div
      #tabListContainer
      class="z-[1] flex grow touch-manipulation overflow-hidden"
      [class.cursor-grab]="showPaginationControls() && !dragging"
      [class.cursor-grabbing]="dragging"
      (pointerdown)="onTabDragStart($event)"
      (pointermove)="onTabDragMove($event)"
      (pointerup)="onTabDragEnd($event)"
      (pointercancel)="onTabDragEnd($event)"
      (keydown)="_handleKeydown($event)"
    >
      <div
        class="relative grow"
        [class.transition-transform]="!dragging"
        #tabList
        role="tablist"
        (cdkObserveContent)="_onContentChanges()"
      >
        <div #tabListInner [class]="_tabListClass()">
          <ng-content />
        </div>
      </div>
    </div>

    <button
      #nextPaginator
      data-pagination="next"
      type="button"
      aria-hidden="true"
      tabindex="-1"
      [class]="_paginationButtonClass(disableScrollAfter)"
      [disabled]="disableScrollAfter || null"
      (click)="_handlePaginatorClick('after')"
      (mousedown)="onPaginatorPress('after', $event)"
      (mouseup)="_stopInterval()"
      (touchend)="_stopInterval()"
    >
      <ng-icon name="lucideChevronRight" />
    </button>
  `,
})
export class HlmTabsPaginatedList extends BrnTabsPaginatedList {
  constructor() {
    super();
    classes(
      () => 'relative flex flex-shrink-0 items-center gap-1 overflow-hidden',
    );
  }

  public readonly items = contentChildren(BrnTabsTrigger, {
    descendants: false,
  });
  /** Explicitly annotating type to avoid non-portable inferred type */
  public readonly itemsChanges: Observable<
    ReadonlyArray<BrnPaginatedTabHeaderItem>
  > = toObservable(this.items);

  public readonly tabListContainer =
    viewChild.required<ElementRef<HTMLElement>>('tabListContainer');
  public readonly tabList =
    viewChild.required<ElementRef<HTMLElement>>('tabList');
  public readonly tabListInner =
    viewChild.required<ElementRef<HTMLElement>>('tabListInner');
  public readonly nextPaginator =
    viewChild.required<ElementRef<HTMLElement>>('nextPaginator');
  public readonly previousPaginator =
    viewChild.required<ElementRef<HTMLElement>>('previousPaginator');

  public readonly tabListClass = input<ClassValue>('', {
    alias: 'tabListClass',
  });
  protected readonly _tabListClass = computed(() =>
    hlm(listVariants(), this.tabListClass()),
  );

  public readonly paginationButtonClass = input<ClassValue>('');

  /**
   * The chevron stays in place over the strip and fades out when that
   * direction has nothing left to scroll. It is taken out of the layout
   * either way, so the first tab stays flush at the start.
   */
  protected _paginationButtonClass(exhausted: boolean) {
    const visible = this.showPaginationControls() && !exhausted;
    return hlm(
      buttonVariants({ variant: 'ghost' }),
      'absolute inset-y-0 z-[2] h-full w-[var(--chrome-tab-fade-size,3.25rem)] rounded-none border-0 bg-transparent px-1.5 shadow-none transition-opacity duration-200 select-none disabled:pointer-events-none',
      visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      this.paginationButtonClass(),
    );
  }

  protected _itemSelected(_event: KeyboardEvent) {
    /* noop - the native button activation selects the focused tab */
  }

  /**
   * A click reveals the next tab that is cut off, instead of jumping a
   * fraction of the strip toward the end.
   */
  override _scrollHeader(direction: 'before' | 'after') {
    this.scrollDistance = this.scrollTarget(direction);
    return {
      maxScrollDistance: this._getMaxScrollDistance(),
      distance: this.scrollDistance,
    };
  }

  protected onPaginatorPress(
    direction: 'before' | 'after',
    event: MouseEvent,
  ): void {
    this._handlePaginatorPress(direction, event);
    const stop = () => {
      this._stopInterval();
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
  }

  /** Scroll position that brings the next clipped tab fully into view. */
  private scrollTarget(direction: 'before' | 'after'): number {
    const viewLength = this.clearViewLength(direction);
    const viewStart = this.scrollDistance;
    const viewEnd = viewStart + viewLength;
    const innerWidth = this.tabListInner().nativeElement.offsetWidth;
    const rtl = this._getLayoutDirection() === 'rtl';
    const epsilon = 1;
    const boxes = this.items().map((item) => {
      const element = item.elementRef.nativeElement;
      const start = rtl
        ? innerWidth - element.offsetLeft - element.offsetWidth
        : element.offsetLeft;
      return { start, end: start + element.offsetWidth };
    });

    if (direction === 'after') {
      const next = boxes.find((box) => box.end > viewEnd + epsilon);
      if (!next) {
        return this._getMaxScrollDistance();
      }
      if (next.end - next.start >= viewLength) {
        return next.start;
      }
      return next.end - viewLength;
    }

    let previous: { start: number; end: number } | undefined;
    for (const box of boxes) {
      if (box.start < viewStart - epsilon) {
        previous = box;
      }
    }
    if (!previous) {
      return 0;
    }
    if (previous.end - previous.start >= viewLength) {
      return previous.end - viewLength;
    }
    return previous.start;
  }

  /**
   * Width of the clear part of the strip: the container minus every fade that
   * covers an edge now, and the fade that this scroll is about to reveal.
   */
  private clearViewLength(direction: 'before' | 'after'): number {
    const view = this.tabListContainer().nativeElement.offsetWidth;
    const before =
      this.showPaginationControls() && !this.disableScrollBefore
        ? this.overlayWidth('before')
        : 0;
    const after =
      this.showPaginationControls() && !this.disableScrollAfter
        ? this.overlayWidth('after')
        : 0;
    const appearing =
      direction === 'after'
        ? this.showPaginationControls() && this.disableScrollBefore
          ? this.overlayWidth('before')
          : 0
        : this.showPaginationControls() && this.disableScrollAfter
          ? this.overlayWidth('after')
          : 0;
    return Math.max(0, view - before - after - appearing);
  }

  /** Chevron width. Absolute buttons keep their width while faded out. */
  private overlayWidth(side: 'before' | 'after'): number {
    const element = (
      side === 'before' ? this.previousPaginator() : this.nextPaginator()
    ).nativeElement;
    return element.offsetWidth;
  }

  /**
   * Keep a focused tab in the clear part of the strip, outside the fades.
   */
  override _scrollToLabel(labelIndex: number): void {
    if (this.disablePagination() || !this.showPaginationControls()) {
      super._scrollToLabel(labelIndex);
      return;
    }
    const selectedLabel = this.items()[labelIndex];
    if (!selectedLabel) {
      return;
    }
    const viewLength = this.tabListContainer().nativeElement.offsetWidth;
    const innerWidth = this.tabListInner().nativeElement.offsetWidth;
    const { offsetLeft, offsetWidth } = selectedLabel.elementRef.nativeElement;
    const rtl = this._getLayoutDirection() === 'rtl';
    const labelBeforePos = rtl
      ? innerWidth - offsetLeft - offsetWidth
      : offsetLeft;
    const labelAfterPos = labelBeforePos + offsetWidth;
    const maxScroll = this._getMaxScrollDistance();
    const beforeWidth = this.overlayWidth('before');
    const afterWidth = this.overlayWidth('after');
    const visibleStart =
      this.scrollDistance + (this.scrollDistance > 0 ? beforeWidth : 0);
    const visibleEnd =
      this.scrollDistance +
      viewLength -
      (this.scrollDistance < maxScroll - 1 ? afterWidth : 0);
    const epsilon = 1;

    if (labelBeforePos < visibleStart - epsilon) {
      const inset = labelBeforePos > 0 ? beforeWidth : 0;
      this.scrollDistance = Math.max(0, labelBeforePos - inset);
      return;
    }
    if (labelAfterPos > visibleEnd + epsilon) {
      const endInset = labelAfterPos < innerWidth - epsilon ? afterWidth : 0;
      const startInset = labelBeforePos > epsilon ? beforeWidth : 0;
      const scrollForEnd = labelAfterPos - (viewLength - endInset);
      const scrollForStart = labelBeforePos - startInset;
      this.scrollDistance = Math.min(
        maxScroll,
        Math.max(0, Math.min(scrollForEnd, scrollForStart)),
      );
    }
  }

  /** True while a pointer drag is moving the tab strip. */
  protected dragging = false;

  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartDistance = 0;
  private dragSlop = mouseDragSlop;
  /** Set once the gesture is clearly horizontal or vertical. */
  private dragAxis: 'undecided' | 'x' | 'y' = 'undecided';
  private clickSwallow?: (event: Event) => void;
  private clickSwallowTimer?: ReturnType<typeof setTimeout>;

  override ngOnDestroy(): void {
    this.disarmClickSwallow();
    super.ngOnDestroy();
  }

  protected onTabDragStart(event: PointerEvent): void {
    // A previous swipe can leave a click-blocker behind when the browser drops
    // the click. Clear it before this tap, or the tab under the finger stays put.
    this.disarmClickSwallow();
    if (event.button !== 0 || !this.showPaginationControls()) {
      return;
    }
    if (
      event.target instanceof Element &&
      event.target.closest('[data-pagination]')
    ) {
      return;
    }
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartDistance = this.scrollDistance;
    this.dragSlop =
      event.pointerType === 'mouse' || event.pointerType === 'pen'
        ? mouseDragSlop
        : touchDragSlop;
    this.dragAxis = 'undecided';
    this.dragging = false;
  }

  protected onTabDragMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId || this.dragAxis === 'y') {
      return;
    }
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    if (!this.dragging) {
      if (Math.hypot(deltaX, deltaY) < this.dragSlop) {
        return;
      }
      // A vertical move is a page scroll. Capturing it would freeze the page
      // and cancel the tap.
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        this.dragAxis = 'y';
        this.dragPointerId = null;
        return;
      }
      this.dragAxis = 'x';
      this.dragging = true;
      this.tabList().nativeElement.style.transition = 'none';
      const container = event.currentTarget;
      if (container instanceof HTMLElement) {
        try {
          container.setPointerCapture(event.pointerId);
        } catch {
          // The pointer may already be gone. Later move events still scroll the strip.
        }
      }
      this._changeDetectorRef.markForCheck();
    }
    const direction = this._getLayoutDirection() === 'rtl' ? -1 : 1;
    this.scrollDistance = this.dragStartDistance - deltaX * direction;
    this._updateTabScrollPosition();
  }

  protected onTabDragEnd(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }
    const wasDragging = this.dragging;
    this.dragPointerId = null;
    this.dragging = false;
    this.dragAxis = 'undecided';
    this.tabList().nativeElement.style.transition = '';
    const container = event.currentTarget;
    if (
      container instanceof HTMLElement &&
      container.hasPointerCapture(event.pointerId)
    ) {
      container.releasePointerCapture(event.pointerId);
    }
    if (!wasDragging) {
      return;
    }
    // The click that follows a drag would otherwise select the tab under the pointer.
    this.armClickSwallow();
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Swallows the click synthesized for the swipe that just ended.
   * Pointer capture often drops that click; the blocker must not stay armed
   * and discard the next tap.
   */
  private armClickSwallow(): void {
    this.disarmClickSwallow();
    const swallow = (clickEvent: Event) => {
      this.clickSwallow = undefined;
      const target = clickEvent.target;
      if (target instanceof Element && target.closest('[data-pagination]')) {
        return;
      }
      clickEvent.preventDefault();
      clickEvent.stopImmediatePropagation();
    };
    this.clickSwallow = swallow;
    document.addEventListener('click', swallow, { capture: true, once: true });
    // The swipe's click is dispatched in this turn or the next. A later tap must
    // not be discarded when the browser never emits that click.
    this.clickSwallowTimer = setTimeout(() => this.disarmClickSwallow(), 50);
  }

  private disarmClickSwallow(): void {
    if (this.clickSwallowTimer !== undefined) {
      clearTimeout(this.clickSwallowTimer);
      this.clickSwallowTimer = undefined;
    }
    if (!this.clickSwallow) {
      return;
    }
    document.removeEventListener('click', this.clickSwallow, {
      capture: true,
    });
    this.clickSwallow = undefined;
  }
}
