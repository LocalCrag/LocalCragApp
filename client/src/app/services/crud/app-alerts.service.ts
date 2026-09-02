import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { AppAlert } from '../../models/app-alert';

/**
 * CRUD service for app-level alerts.
 */
@Injectable({
  providedIn: 'root',
})
export class AppAlertsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private alertsChangedSubject = new Subject<void>();

  public readonly alertsChanged$ = this.alertsChangedSubject.asObservable();

  public notifyAlertsChanged(): void {
    this.alertsChangedSubject.next();
  }

  public getActiveAlerts(): Observable<AppAlert[]> {
    return this.http
      .get<any[]>(this.api.appAlerts.getList())
      .pipe(
        map((alerts) => alerts.map((alert) => AppAlert.deserialize(alert))),
      );
  }

  public getAllAlerts(): Observable<AppAlert[]> {
    return this.http
      .get<any[]>(this.api.appAlerts.getManageList())
      .pipe(
        map((alerts) => alerts.map((alert) => AppAlert.deserialize(alert))),
      );
  }

  public getAlert(id: string): Observable<AppAlert> {
    return this.http
      .get(this.api.appAlerts.getDetail(id))
      .pipe(map(AppAlert.deserialize));
  }

  public createAlert(alert: AppAlert): Observable<AppAlert> {
    return this.http
      .post(this.api.appAlerts.create(), AppAlert.serialize(alert))
      .pipe(
        map(AppAlert.deserialize),
        tap(() => this.notifyAlertsChanged()),
      );
  }

  public updateAlert(alert: AppAlert): Observable<AppAlert> {
    return this.http
      .put(this.api.appAlerts.update(alert.id), AppAlert.serialize(alert))
      .pipe(
        map(AppAlert.deserialize),
        tap(() => this.notifyAlertsChanged()),
      );
  }

  public deleteAlert(alert: AppAlert): Observable<null> {
    return this.http.delete(this.api.appAlerts.delete(alert.id)).pipe(
      map(() => null),
      tap(() => this.notifyAlertsChanged()),
    );
  }
}
