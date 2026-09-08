import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { AdminMessage } from '../../models/admin-message';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root',
})
export class AdminMessagesService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private notificationsService = inject(NotificationsService);

  public getAllMessages(): Observable<AdminMessage[]> {
    return this.http
      .get<any[]>(this.api.adminMessages.getList())
      .pipe(
        map((messages) =>
          messages.map((message) => AdminMessage.deserialize(message)),
        ),
      );
  }

  public getMessage(id: string): Observable<AdminMessage> {
    return this.http
      .get(this.api.adminMessages.getDetail(id))
      .pipe(map(AdminMessage.deserialize));
  }

  public createMessage(message: AdminMessage): Observable<AdminMessage> {
    return this.http
      .post(this.api.adminMessages.create(), AdminMessage.serialize(message))
      .pipe(
        map(AdminMessage.deserialize),
        tap(() => this.notificationsService.notifyUpdated()),
      );
  }

  public updateMessage(message: AdminMessage): Observable<AdminMessage> {
    return this.http
      .put(
        this.api.adminMessages.update(message.id),
        AdminMessage.serialize(message),
      )
      .pipe(map(AdminMessage.deserialize));
  }

  public deleteMessage(message: AdminMessage): Observable<null> {
    return this.http.delete(this.api.adminMessages.delete(message.id)).pipe(
      map(() => null),
      tap(() => this.notificationsService.notifyUpdated()),
    );
  }
}
