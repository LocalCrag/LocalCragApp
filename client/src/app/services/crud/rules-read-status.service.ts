import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { select, Store } from '@ngrx/store';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { selectIsLoggedIn } from '../../ngrx/selectors/auth.selectors';

/**
 * The PascalCase entity types that can carry a `rules` field and therefore a
 * read-status entry. Matches the backend `entityType` validation
 * (`Region`/`Crag`/`Sector`) and is used verbatim in the localStorage keys and
 * the account read-status payloads.
 */
export type RulesEntityType = 'Region' | 'Crag' | 'Sector';

export interface RulesReadStatusRef {
  entityType: RulesEntityType;
  entityId: string;
}

interface RulesReadStatusRow {
  entityType: string;
  entityId: string;
  readAt: string;
}

/** localStorage key for anonymous visitors. `V1` allows a future schema bump. */
const STORAGE_KEY = 'rulesReadStatusV1';

/**
 * Persists "rules read" status per topo entity (region/crag/sector).
 *
 * Logged-in users are backed by the `/account/rules-read-status` endpoints;
 * anonymous visitors are backed by a localStorage map. Both paths share an
 * in-memory cache so repeated lookups within a session don't re-fetch/re-read.
 */
@Injectable({
  providedIn: 'root',
})
export class RulesReadStatusService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private store = inject(Store);

  private cache = new Map<string, Date>();
  private loaded$: Observable<void> | null = null;

  /**
   * Returns the read timestamp for a given entity, loading the backing store
   * (account API or localStorage) once per session.
   */
  public getReadAt(
    entityType: RulesEntityType,
    entityId: string,
  ): Observable<Date | null> {
    return this.ensureLoaded().pipe(
      map(() => this.cache.get(this.key(entityType, entityId)) ?? null),
    );
  }

  /**
   * Marks the given entities as read now, persisting to the account API (when
   * logged in) or localStorage (when anonymous).
   */
  public markRead(entities: RulesReadStatusRef[]): Observable<void> {
    if (!entities.length) {
      return of(void 0);
    }
    const now = new Date();
    return this.ensureLoaded().pipe(
      switchMap(() => this.store.pipe(select(selectIsLoggedIn), take(1))),
      switchMap((isLoggedIn) => {
        entities.forEach((entity) =>
          this.cache.set(this.key(entity.entityType, entity.entityId), now),
        );
        if (isLoggedIn) {
          return forkJoin(
            entities.map((entity) =>
              this.http.post<void>(this.api.account.markRulesRead(), {
                entityType: entity.entityType,
                entityId: entity.entityId,
              }),
            ),
          ).pipe(map(() => void 0));
        }
        this.persistLocalStorage();
        return of(void 0);
      }),
    );
  }

  private ensureLoaded(): Observable<void> {
    if (!this.loaded$) {
      this.loaded$ = this.store.pipe(select(selectIsLoggedIn), take(1)).pipe(
        switchMap((isLoggedIn) => {
          if (!isLoggedIn) {
            this.hydrateFromLocalStorage();
            return of(void 0);
          }
          return this.http
            .get<RulesReadStatusRow[]>(this.api.account.getRulesReadStatus())
            .pipe(
              map((rows) => {
                rows.forEach((row) => {
                  this.cache.set(
                    this.key(row.entityType as RulesEntityType, row.entityId),
                    new Date(row.readAt),
                  );
                });
              }),
              catchError(() => of(void 0)),
            );
        }),
        shareReplay(1),
      );
    }
    return this.loaded$;
  }

  private key(entityType: RulesEntityType, entityId: string): string {
    return `${entityType}:${entityId}`;
  }

  private hydrateFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      Object.entries(parsed).forEach(([key, value]) => {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          this.cache.set(key, date);
        }
      });
    } catch {
      // ignore invalid/corrupt storage
    }
  }

  private persistLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const payload: Record<string, string> = {};
      this.cache.forEach((value, key) => {
        payload[key] = value.toISOString();
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }
}
