import { inject, Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationItem } from '../../models/notification-item';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(
      this.api.account.getNotifications(),
    );
  }

  markRead(notificationIds: string[]): Observable<null> {
    return this.http.post<null>(this.api.account.markNotificationsRead(), {
      notificationIds,
    });
  }
}
