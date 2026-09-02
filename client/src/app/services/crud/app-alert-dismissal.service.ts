import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { selectIsLoggedIn } from '../../ngrx/selectors/auth.selectors';
import { parseServerUtcDate } from '../../utility/parse-server-utc-date';
import { AppAlert } from '../../models/app-alert';

const STORAGE_KEY = 'appAlertDismissalsV1';
const EPOCH = new Date(0);

/**
 * Persists anonymous dismissals in localStorage. Logged-in dismissals are
 * stored on the server and filtered out by GET /api/app-alerts.
 */
@Injectable({
  providedIn: 'root',
})
export class AppAlertDismissalService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private store = inject(Store);

  /**
   * For anonymous users, filters out alerts dismissed in localStorage.
   * Logged-in users receive a pre-filtered list from the API.
   */
  public filterVisibleAlerts(alerts: AppAlert[]): Observable<AppAlert[]> {
    if (!alerts.length) {
      return of([]);
    }
    return this.store.pipe(
      select(selectIsLoggedIn),
      take(1),
      map((isLoggedIn) => {
        if (isLoggedIn) {
          return alerts;
        }
        const cache = this.readLocalStorage();
        return alerts.filter((alert) => {
          const dismissedAt = cache.get(alert.id);
          if (!dismissedAt) {
            return true;
          }
          const updatedAt = this.effectiveUpdatedAt(alert.timeUpdated);
          return updatedAt > dismissedAt;
        });
      }),
    );
  }

  public dismiss(alert: AppAlert): Observable<void> {
    return this.store.pipe(
      select(selectIsLoggedIn),
      take(1),
      switchMap((isLoggedIn) => {
        if (!isLoggedIn) {
          this.writeLocalDismissal(alert.id);
          return of(void 0);
        }
        return this.http
          .post<void>(this.api.account.markAppAlertDismissed(), {
            alertId: alert.id,
          })
          .pipe(catchError(() => of(void 0)));
      }),
    );
  }

  private writeLocalDismissal(alertId: string): void {
    const cache = this.readLocalStorage();
    cache.set(alertId, new Date());
    this.persistLocalStorage(cache);
  }

  private effectiveUpdatedAt(value: Date | string | null | undefined): Date {
    return parseServerUtcDate(value) ?? EPOCH;
  }

  private readLocalStorage(): Map<string, Date> {
    const cache = new Map<string, Date>();
    if (typeof localStorage === 'undefined') {
      return cache;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cache;
      }
      const parsed = JSON.parse(raw) as Record<string, string>;
      Object.entries(parsed).forEach(([key, value]) => {
        const date = parseServerUtcDate(value);
        if (date) {
          cache.set(key, date);
        }
      });
    } catch {
      // ignore invalid/corrupt storage
    }
    return cache;
  }

  private persistLocalStorage(cache: Map<string, Date>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      const payload: Record<string, string> = {};
      cache.forEach((value, key) => {
        payload[key] = value.toISOString();
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }
}
