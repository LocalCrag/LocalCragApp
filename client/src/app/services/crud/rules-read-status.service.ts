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
  /** The `rulesUpdatedAt` value being acknowledged by this mark-read. */
  acknowledgedUpdatedAt: Date | null;
}

export interface RulesReadStatusEntry {
  readAt: Date;
  /** Rules version that was current when the user last acknowledged them. */
  acknowledgedUpdatedAt: Date | null;
}

interface RulesReadStatusRow {
  entityType: string;
  entityId: string;
  readAt: string;
  acknowledgedRulesUpdatedAt: string | null;
}

/** localStorage key for anonymous visitors and as a client-side backup when logged in. */
const STORAGE_KEY = 'rulesReadStatusV2';

/** Sentinel so a mark-read without a server timestamp still counts as acknowledged. */
const EPOCH = new Date(0);

/**
 * Persists "rules read" status per topo entity (region/crag/sector).
 *
 * Always writes localStorage so dismissals survive reloads even if the account
 * API call fails. Logged-in users also sync to `/account/rules-read-status`.
 *
 * "Updated since last view" is derived by comparing the entity's current
 * `rulesUpdatedAt` to the acknowledged version stored here — not by comparing
 * wall-clock read timestamps.
 */
@Injectable({
  providedIn: 'root',
})
export class RulesReadStatusService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private store = inject(Store);

  private cache = new Map<string, RulesReadStatusEntry>();
  private loaded$: Observable<void> | null = null;

  /**
   * Returns the stored read entry for a given entity, loading the backing store
   * (localStorage and, when logged in, the account API) once per session.
   */
  public getStatus(
    entityType: RulesEntityType,
    entityId: string,
  ): Observable<RulesReadStatusEntry | null> {
    return this.ensureLoaded().pipe(
      map(() => this.cache.get(this.key(entityType, entityId)) ?? null),
    );
  }

  /**
   * Marks the given entities as read now, persisting the acknowledged rules
   * version so later updates can be detected independently of clock skew.
   */
  public markRead(entities: RulesReadStatusRef[]): Observable<void> {
    if (!entities.length) {
      return of(void 0);
    }
    const now = new Date();
    return this.ensureLoaded().pipe(
      switchMap(() => this.store.pipe(select(selectIsLoggedIn), take(1))),
      switchMap((isLoggedIn) => {
        entities.forEach((entity) => {
          this.cache.set(this.key(entity.entityType, entity.entityId), {
            readAt: now,
            acknowledgedUpdatedAt: this.normalizeAcknowledgedUpdatedAt(
              entity.acknowledgedUpdatedAt,
            ),
          });
        });
        // Always persist locally so "Already read" survives reload even when
        // the account API is unavailable or the user is anonymous.
        this.persistLocalStorage();

        if (!isLoggedIn) {
          return of(void 0);
        }
        return forkJoin(
          entities.map((entity) =>
            this.http
              .post<void>(this.api.account.markRulesRead(), {
                entityType: entity.entityType,
                entityId: entity.entityId,
                acknowledgedRulesUpdatedAt: this.normalizeAcknowledgedUpdatedAt(
                  entity.acknowledgedUpdatedAt,
                ).toISOString(),
              })
              .pipe(catchError(() => of(void 0))),
          ),
        ).pipe(map(() => void 0));
      }),
    );
  }

  /**
   * Lazily hydrates the in-memory cache once per service lifetime.
   *
   * Always seeds from localStorage first; when the user is logged in, merges
   * account API rows on top and writes the merged cache back to localStorage.
   * The resulting observable is memoized via `shareReplay(1)` so concurrent
   * `getStatus` / `markRead` callers share a single load.
   */
  private ensureLoaded(): Observable<void> {
    if (!this.loaded$) {
      this.loaded$ = this.store.pipe(select(selectIsLoggedIn), take(1)).pipe(
        switchMap((isLoggedIn) => {
          this.hydrateFromLocalStorage();
          if (!isLoggedIn) {
            return of(void 0);
          }
          return this.http
            .get<RulesReadStatusRow[]>(this.api.account.getRulesReadStatus())
            .pipe(
              map((rows) => {
                rows.forEach((row) => {
                  this.cache.set(
                    this.key(row.entityType as RulesEntityType, row.entityId),
                    {
                      readAt: new Date(row.readAt),
                      acknowledgedUpdatedAt:
                        this.normalizeAcknowledgedUpdatedAt(
                          row.acknowledgedRulesUpdatedAt,
                        ),
                    },
                  );
                });
                // Keep localStorage in sync with the merged cache.
                this.persistLocalStorage();
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

  /**
   * Parses acknowledged timestamps the same way models parse API dates
   * (`new Date(...)`). Missing/invalid values become the epoch sentinel so a
   * mark-read without a server timestamp still counts as acknowledged.
   */
  private normalizeAcknowledgedUpdatedAt(
    value: Date | string | null | undefined,
  ): Date {
    if (value == null || value === '') {
      return EPOCH;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? EPOCH : value;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? EPOCH : date;
  }

  private hydrateFromLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<
        string,
        { readAt: string; acknowledgedUpdatedAt: string | null }
      >;
      Object.entries(parsed).forEach(([key, value]) => {
        const date = new Date(value.readAt);
        if (!isNaN(date.getTime())) {
          this.cache.set(key, {
            readAt: date,
            acknowledgedUpdatedAt: this.normalizeAcknowledgedUpdatedAt(
              value.acknowledgedUpdatedAt,
            ),
          });
        }
      });
    } catch {
      // ignore invalid/corrupt storage
    }
  }

  private persistLocalStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const payload: Record<
        string,
        { readAt: string; acknowledgedUpdatedAt: string | null }
      > = {};
      this.cache.forEach((value, key) => {
        payload[key] = {
          readAt: value.readAt.toISOString(),
          acknowledgedUpdatedAt:
            value.acknowledgedUpdatedAt?.toISOString() ?? null,
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }
}
