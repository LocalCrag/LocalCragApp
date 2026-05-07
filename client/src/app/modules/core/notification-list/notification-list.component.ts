import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { NotificationsService } from '../../../services/crud/notifications.service';
import { NotificationItem } from '../../../models/notification-item';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { finalize } from 'rxjs/operators';
import { NotificationPresentationService } from '../notification-presentation.service';

@Component({
  selector: 'lc-notification-list',
  imports: [
    TranslocoDirective,
    CardModule,
    ButtonModule,
    MessageModule,
    DatePipe,
  ],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [LineGradePipe, NotificationPresentationService],
})
export class NotificationListComponent implements OnInit {
  public notifications: NotificationItem[] = [];
  public currentPage = 0;
  public hasNextPage = true;
  public loading = false;

  private readonly perPage = 20;
  public notificationUi = inject(NotificationPresentationService);
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadFirstPage();
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
    if (notification.isDismissed) {
      this.router.navigateByUrl(notification.actionLink as string);
      return;
    }
    this.notificationsService.dismiss(notification.id).subscribe(() => {
      this.notifications = this.notifications.map((item) =>
        item.id === notification.id ? { ...item, isDismissed: true } : item,
      );
      this.router.navigateByUrl(notification.actionLink as string);
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
    const hasUnread = this.notifications.some(
      (notification) => !notification.isDismissed,
    );
    if (!hasUnread) {
      return;
    }
    this.notificationsService.dismissAll().subscribe(() => {
      this.notifications = this.notifications.map((item) => ({
        ...item,
        isDismissed: true,
      }));
    });
  }
}
