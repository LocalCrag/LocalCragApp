import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Ascent } from '../../../models/ascent';
import { InstanceStatistics } from '../../../models/instance-statistics';
import { StatisticsService } from '../../../services/crud/statistics.service';
import { TopoHierarchyBreadcrumbsComponent } from '../../shared/components/topo-hierarchy-breadcrumbs/topo-hierarchy-breadcrumbs.component';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideStar, lucideTicket } from '@ng-icons/lucide';
import {
  OverlayPositionBuilder,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import { BrnOverlay, BrnOverlayContent } from '@spartan-ng/brain/overlay';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmPopoverContent } from '@spartan-ng/helm/popover';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [provideIcons({ lucideCalendar, lucideStar, lucideTicket })],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    NgIcon,
    BrnOverlay,
    BrnOverlayContent,
    HlmPopoverContent,
    HlmBadge,
    HlmSkeleton,
    TranslocoDirective,
    RouterLink,
    LineGradePipe,
    DatePipe,
    TopoHierarchyBreadcrumbsComponent,
  ],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private statisticsService = inject(StatisticsService);
  private positionBuilder = inject(OverlayPositionBuilder);
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly showDelayMs = 350;
  private readonly hideDelayMs = 150;

  @ViewChild(BrnOverlay) ascentPopover?: BrnOverlay;

  /**
   * Beside the hovered row, tops aligned when the card fits in the viewport.
   * Spartan's popover always anchors below its origin and ignores
   * `attachPositions`, so this strategy is passed in directly.
   */
  readonly ascentPopoverPositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: 8,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: -8,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetX: 8,
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetX: -8,
    },
  ];

  readonly ascentPopoverStrategy = this.positionBuilder
    .flexibleConnectedTo({ x: 0, y: 0 })
    .withPositions(this.ascentPopoverPositions)
    .withFlexibleDimensions(false)
    .withPush(true)
    .withViewportMargin(8);

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

    if (this.ascentPopover?.stateComputed() === 'open') {
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
      this.ascentPopover?.close();
      this.activeAscent = null;
    }, this.hideDelayMs);
  }

  private openAscentPopover(target: HTMLElement, ascent: Ascent): void {
    this.activeAscent = ascent;
    const popover = this.ascentPopover;
    if (!popover) {
      return;
    }
    this.ascentPopoverStrategy.setOrigin(target);
    if (popover.stateComputed() === 'open') {
      // Opening again does not move an overlay that is already open.
      popover.updatePosition();
      return;
    }
    popover.open();
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
