import { inject, Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { NotificationItem } from '../../models/notification-item';
import { Paginated } from '../../models/paginated';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private notificationUpdatesSubject = new Subject<void>();

  public notificationUpdates$ = this.notificationUpdatesSubject.asObservable();

  getNotifications(
    page: number,
    perPage: number,
    includeDismissed: boolean,
  ): Observable<Paginated<NotificationItem>> {
    const query = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
      include_dismissed: includeDismissed ? '1' : '0',
    });
    return this.http.get<Paginated<NotificationItem>>(
      this.api.account.getNotifications(`?${query.toString()}`),
    );
  }

  getNotificationCount(): Observable<number> {
    return this.http
      .get<{ count: number }>(this.api.account.getNotificationsCount())
      .pipe(map((response) => response.count));
  }

  dismiss(notificationId: string): Observable<null> {
    return this.http
      .post<null>(this.api.account.dismissNotification(notificationId), null)
      .pipe(
        tap(() => {
          this.notificationUpdatesSubject.next();
        }),
      );
  }

  dismissAll(): Observable<null> {
    return this.http
      .post<null>(this.api.account.dismissAllNotifications(), null)
      .pipe(
        tap(() => {
          this.notificationUpdatesSubject.next();
        }),
      );
  }
}
