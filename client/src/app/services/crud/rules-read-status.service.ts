import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { forkJoin, merge, Observable, of, timer } from 'rxjs';
import {
  catchError,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
} from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { autoLoginFailed } from '../../ngrx/actions/auth.actions';
import { selectIsLoggedIn } from '../../ngrx/selectors/auth.selectors';
import { parseServerUtcDate } from '../../utility/parse-server-utc-date';

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

/** Auth credentials key — presence means auto-login may still be in flight. */
const AUTH_STORAGE_KEY = 'LocalCragAuth';

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
  private actions$ = inject(Actions);

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
   * Waits for auto-login to resolve so a cold start does not permanently skip
   * the account API (see #1230). Always seeds from localStorage first; when
   * the user is logged in, merges account API rows on top and writes the merged
   * cache back to localStorage. Memoized via `shareReplay(1)`.
   */
  private ensureLoaded(): Observable<void> {
    if (!this.loaded$) {
      this.loaded$ = this.waitForAuthResolved().pipe(
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
                      readAt: this.normalizeAcknowledgedUpdatedAt(row.readAt),
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

  /**
   * Resolves whether the user is logged in after auto-login has had a chance
   * to run. If `LocalCragAuth` is present but `isLoggedIn` is still false,
   * waits for login success, `autoLoginFailed`, or a short timeout.
   */
  private waitForAuthResolved(): Observable<boolean> {
    return this.store.pipe(select(selectIsLoggedIn), take(1)).pipe(
      switchMap((isLoggedIn) => {
        if (isLoggedIn) {
          return of(true);
        }
        const authPending =
          typeof localStorage !== 'undefined' &&
          localStorage.getItem(AUTH_STORAGE_KEY) !== null;
        if (!authPending) {
          return of(false);
        }
        return merge(
          this.store.pipe(
            select(selectIsLoggedIn),
            filter((loggedIn) => loggedIn),
            map(() => true),
          ),
          this.actions$.pipe(
            ofType(autoLoginFailed),
            map(() => false),
          ),
          // Safety net if tryAutoLogin never runs (non-core hosts / tests).
          timer(3000).pipe(
            switchMap(() => this.store.pipe(select(selectIsLoggedIn), take(1))),
          ),
        ).pipe(take(1));
      }),
    );
  }

  private key(entityType: RulesEntityType, entityId: string): string {
    return `${entityType}:${entityId}`;
  }

  /**
   * Parses acknowledged timestamps as server UTC (naive ISO → UTC). Missing /
   * invalid values become the epoch sentinel so a mark-read without a server
   * timestamp still counts as acknowledged.
   */
  private normalizeAcknowledgedUpdatedAt(
    value: Date | string | null | undefined,
  ): Date {
    return parseServerUtcDate(value) ?? EPOCH;
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
        const date = parseServerUtcDate(value.readAt);
        if (date) {
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
