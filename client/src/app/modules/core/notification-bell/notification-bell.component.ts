import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Popover } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { NotificationsService } from '../../../services/crud/notifications.service';
import { NotificationItem } from '../../../models/notification-item';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { MOBILE_BREAKPOINT_HEADER_MENU } from '../../../utility/misc/breakpoints';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { NotificationPresentationService } from '../notification-presentation.service';
import { AppNotificationsService } from '../../../services/core/app-notifications.service';
import { loadUnreadNotificationCount } from '../../../ngrx/actions/notifications.actions';
import { selectUnreadNotificationCount } from '../../../ngrx/selectors/account-notifications.selectors';

@Component({
  selector: 'lc-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [TranslocoDirective, Popover, RouterLink, ProgressSpinnerModule],
  providers: [LineGradePipe, NotificationPresentationService],
})
export class NotificationBellComponent implements OnInit {
  notifications: NotificationItem[] = [];
  currentPage = 0;
  hasNextPage = true;
  loading = false;
  private skipNextRefresh = false;

  private readonly perPage = 20;

  public notificationUi = inject(NotificationPresentationService);
  private appNotifications = inject(AppNotificationsService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  readonly unreadCount = toSignal(
    this.store.select(selectUnreadNotificationCount),
    { initialValue: 0 },
  );

  ngOnInit(): void {
    this.store.dispatch(loadUnreadNotificationCount());
    this.loadFirstPage();
    this.notificationsService.notificationUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.skipNextRefresh) {
          this.skipNextRefresh = false;
          return;
        }
        this.loadFirstPage();
      });
  }

  public loadFirstPage(): void {
    this.currentPage = 0;
    this.notifications = [];
    this.hasNextPage = true;
    this.loadNextPage();
  }

  public loadNextPage(): void {
    if (this.loading || !this.hasNextPage) {
      return;
    }
    this.loading = true;
    const nextPage = this.currentPage + 1;
    this.notificationsService
      .getNotifications(nextPage, this.perPage, false)
      .subscribe({
        next: (response) => {
          this.currentPage = nextPage;
          this.hasNextPage = response.hasNext;
          this.notifications = [...this.notifications, ...response.items];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.hasNextPage = false;
        },
      });
  }

  public openNotification(item: NotificationItem, popover: Popover): void {
    if (item.isDismissed) {
      popover.hide();
      this.router.navigateByUrl(item.actionLink as string);
      return;
    }
    this.notificationsService.dismiss(item.id).subscribe(() => {
      this.markItemDismissed(item.id);
      popover.hide();
      this.router.navigateByUrl(item.actionLink as string);
    });
  }

  public markNotificationRead(item: NotificationItem): void {
    if (item.isDismissed) {
      return;
    }
    // Skip next refresh as markItemDismissed will trigger a refresh
    this.skipNextRefresh = true;
    this.notificationsService.dismiss(item.id).subscribe(() => {
      this.markItemDismissed(item.id);
    });
  }

  public markAllRead(popover?: Popover): void {
    if (this.unreadCount() === 0) {
      return;
    }
    this.notificationsService.dismissAll().subscribe(() => {
      this.notifications = [];
      this.currentPage = 0;
      this.hasNextPage = false;
      popover?.hide();
      this.appNotifications.toast('NOTIFICATIONS_MARK_ALL_READ_SUCCESS');
    });
  }

  public onBellClick(event: Event, popover: Popover): void {
    if (window.innerWidth <= MOBILE_BREAKPOINT_HEADER_MENU) {
      this.router.navigateByUrl('/notifications');
      return;
    }
    popover.toggle(event);
  }

  public onPopoverScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 40) {
      this.loadNextPage();
    }
  }

  private markItemDismissed(id: string): void {
    this.notifications = this.notifications.filter((item) => item.id !== id);
  }
}
