import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DialogService } from 'primeng/dynamicdialog';
import { NotificationsService } from '../../../services/crud/notifications.service';
import { NotificationItem } from '../../../models/notification-item';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { finalize } from 'rxjs/operators';
import { NotificationPresentationService } from '../notification-presentation.service';
import { AppNotificationsService } from '../../../services/core/app-notifications.service';
import { loadUnreadNotificationCount } from '../../../ngrx/actions/notifications.actions';
import { selectUnreadNotificationCount } from '../../../ngrx/selectors/account-notifications.selectors';
import { PageTitleService } from '../../../services/core/page-title.service';
import { AdminMessageDialogService } from '../admin-message-dialog/admin-message-dialog.service';

@Component({
  selector: 'lc-notification-list',
  imports: [TranslocoDirective, ButtonModule, MessageModule, DatePipe],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [
    LineGradePipe,
    NotificationPresentationService,
    DialogService,
    AdminMessageDialogService,
  ],
})
export class NotificationListComponent implements OnInit {
  public notifications: NotificationItem[] = [];
  public currentPage = 0;
  public hasNextPage = true;
  public loading = false;

  private readonly perPage = 20;
  public notificationUi = inject(NotificationPresentationService);
  private appNotifications = inject(AppNotificationsService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);
  private adminMessageDialog = inject(AdminMessageDialogService);

  readonly unreadCount = toSignal(
    this.store.select(selectUnreadNotificationCount),
    { initialValue: 0 },
  );

  ngOnInit(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(marker('menu.notificationsDetailTitle')),
    );
    this.store.dispatch(loadUnreadNotificationCount());
    this.loadFirstPage();
    this.route.queryParamMap.subscribe((params) => {
      const messageId = params.get('adminMessage');
      if (messageId) {
        this.adminMessageDialog.openById(messageId);
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { adminMessage: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
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
      .getNotifications(nextPage, this.perPage, true)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.currentPage = nextPage;
          this.hasNextPage = response.hasNext;
          this.notifications = [...this.notifications, ...response.items];
        },
        error: () => {
          this.hasNextPage = false;
        },
      });
  }

  public openNotification(notification: NotificationItem): void {
    const go = (): void => {
      if (notification.type === 'admin_message' && notification.entityId) {
        this.adminMessageDialog.openById(
          notification.entityId,
          notification.properties.adminMessage,
        );
        return;
      }
      const link = notification.actionLink as string | undefined;
      if (link) {
        this.router.navigateByUrl(link);
      }
    };

    if (notification.isDismissed) {
      go();
      return;
    }
    this.notificationsService.dismiss(notification.id).subscribe(() => {
      this.notifications = this.notifications.map((item) =>
        item.id === notification.id ? { ...item, isDismissed: true } : item,
      );
      go();
    });
  }

  public markNotificationRead(notification: NotificationItem): void {
    if (notification.isDismissed) {
      return;
    }
    this.notificationsService.dismiss(notification.id).subscribe(() => {
      this.notifications = this.notifications.map((item) =>
        item.id === notification.id ? { ...item, isDismissed: true } : item,
      );
    });
  }

  public markAllRead(): void {
    if (this.unreadCount() === 0) {
      return;
    }
    this.notificationsService.dismissAll().subscribe(() => {
      this.notifications = this.notifications.map((item) => ({
        ...item,
        isDismissed: true,
      }));
      this.appNotifications.toast('NOTIFICATIONS_MARK_ALL_READ_SUCCESS');
    });
  }
}
