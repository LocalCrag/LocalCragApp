import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Popover } from 'primeng/popover';
import { RatingModule } from 'primeng/rating';
import { Skeleton } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { Ascent } from '../../../models/ascent';
import { InstanceStatistics } from '../../../models/instance-statistics';
import { StatisticsService } from '../../../services/crud/statistics.service';
import { TopoHierarchyBreadcrumbsComponent } from '../../shared/components/topo-hierarchy-breadcrumbs/topo-hierarchy-breadcrumbs.component';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';

@Component({
  selector: 'lc-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    RouterLink,
    LineGradePipe,
    Skeleton,
    Popover,
    RatingModule,
    TagModule,
    FormsModule,
    DatePipe,
    TopoHierarchyBreadcrumbsComponent,
  ],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private statisticsService = inject(StatisticsService);
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly showDelayMs = 350;
  private readonly hideDelayMs = 150;

  @ViewChild('ascentPopover') ascentPopover: Popover;

  stats: InstanceStatistics | null = null;
  loading = true;
  activeAscent: Ascent | null = null;

  ngOnInit(): void {
    this.statisticsService.getInstanceStatistics().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.clearHideTimeout();
    this.clearShowTimeout();
  }

  showAscentPopover(event: Event, ascent: Ascent): void {
    this.clearHideTimeout();
    this.clearShowTimeout();

    const target = (event.currentTarget || event.target) as HTMLElement;

    if (this.ascentPopover.overlayVisible) {
      this.openAscentPopover(target, ascent);
      return;
    }

    this.showTimeout = setTimeout(() => {
      this.showTimeout = null;
      this.openAscentPopover(target, ascent);
    }, this.showDelayMs);
  }

  keepAscentPopover(): void {
    this.clearHideTimeout();
    this.clearShowTimeout();
  }

  scheduleHideAscentPopover(): void {
    this.clearHideTimeout();
    this.clearShowTimeout();
    this.hideTimeout = setTimeout(() => {
      this.ascentPopover?.hide();
      this.activeAscent = null;
    }, this.hideDelayMs);
  }

  /**
   * Places the ascent popover to the right of its trigger row.
   *
   * PrimeNG's `p-popover` only aligns above/below the target (`absolutePosition`).
   * For the left sidebar we need a right-side placement so the overlay sits over the
   * main content instead of covering the list. This runs after PrimeNG's own align
   * (via `onShow`, and again when switching rows while already open) and overrides
   * left/top, clears the below/above gutter + flip classes, and falls back to the
   * left side only when there is not enough horizontal space.
   */
  positionAscentPopoverRight(): void {
    const container = this.ascentPopover?.container;
    const target = this.ascentPopover?.target as HTMLElement | undefined;
    if (!container || !target) {
      return;
    }

    const gap = 8;
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Prefer: flush with the row top, immediately to the right of the sidebar item.
    let left = targetRect.right + gap + scrollX;
    let top = targetRect.top + scrollY;

    // Keep the panel inside the viewport vertically.
    const maxTop = scrollY + window.innerHeight - containerRect.height - gap;
    top = Math.min(
      Math.max(scrollY + gap, top),
      Math.max(scrollY + gap, maxTop),
    );

    // Fallback: mirror to the left if the panel would overflow the window edge.
    if (targetRect.right + gap + containerRect.width > window.innerWidth) {
      left = targetRect.left - gap - containerRect.width + scrollX;
    }

    container.style.insetInlineStart = `${left}px`;
    container.style.top = `${top}px`;
    // Undo PrimeNG's default below/above gutter and flip styling.
    container.style.marginTop = '0';
    container.style.marginBottom = '0';
    container.removeAttribute('data-p-popover-flipped');
    container.classList.remove('p-popover-flipped');
  }

  private openAscentPopover(target: HTMLElement, ascent: Ascent): void {
    this.activeAscent = ascent;
    const wasVisible = this.ascentPopover.overlayVisible;
    this.ascentPopover.show(null, target);
    if (wasVisible) {
      requestAnimationFrame(() => this.positionAscentPopoverRight());
    }
  }

  private clearHideTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private clearShowTimeout(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }
}
