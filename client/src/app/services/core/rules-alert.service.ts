import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  PRIMARY_OUTLET,
  Router,
  RoutesRecognized,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  RulesEntityType,
  RulesReadStatusService,
} from '../crud/rules-read-status.service';
import {
  isRulesUnread,
  isRulesUpdatedSinceLastView,
} from '../crud/rules-read-status.util';

/** An ancestor (region/crag/sector) considered for the rules alert on a topo page. */
export interface RulesEntity {
  entityType: RulesEntityType;
  id: string;
  name: string;
  rules: string | null;
  rulesTitle: string | null;
  rulesUpdatedAt: string | null;
}

export type RulesAlertLevel = 'sector' | 'crag' | 'region';

export interface RulesAlertSection {
  level: RulesAlertLevel;
  title: string;
  rules: string;
  updatedAt: string | null;
  updatedSinceLastView: boolean;
}

export interface RulesAlertState {
  visible: boolean;
  title: string | null;
  updatedSinceLastView: boolean;
  rulesSections: RulesAlertSection[];
}

const initialState: RulesAlertState = {
  visible: false,
  title: null,
  updatedSinceLastView: false,
  rulesSections: [],
};

const LEVEL_BY_ENTITY_TYPE: Record<RulesEntityType, RulesAlertLevel> = {
  Sector: 'sector',
  Crag: 'crag',
  Region: 'region',
};

/** Minimal shape shared by the Region/Crag/Sector models for `toRulesEntity`. */
interface RulesCapableModel {
  id: string;
  name: string;
  rules: string | null;
  rulesTitle: string | null;
  rulesUpdatedAt: string | null;
}

/** Maps a Region/Crag/Sector model instance into a `RulesEntity` for `setContext(...)`. */
export function toRulesEntity(
  entityType: RulesEntityType,
  entity: RulesCapableModel,
): RulesEntity {
  return {
    entityType,
    id: entity.id,
    name: entity.name,
    rules: entity.rules,
    rulesTitle: entity.rulesTitle,
    rulesUpdatedAt: entity.rulesUpdatedAt,
  };
}

/**
 * Computes rules-alert visibility/content from an ancestor chain of topo
 * entities (region/crag/sector). Mirrors `PageTitleService`'s
 * BehaviorSubject + clear-on-page-host-change pattern so stale context never
 * leaks between unrelated pages.
 */
@Injectable({
  providedIn: 'root',
})
export class RulesAlertService {
  private readonly stateSubject = new BehaviorSubject<RulesAlertState>({
    ...initialState,
  });

  readonly state$ = this.stateSubject.asObservable();

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly rulesReadStatusService = inject(RulesReadStatusService);

  private currentPageHostKey = '';
  private lastContextKey: string | null = null;
  private emphasizedEntities: RulesEntity[] = [];

  constructor() {
    this.currentPageHostKey = this.getPrimaryPageHostKey(
      this.router.routerState.snapshot.root,
    );

    this.router.events
      .pipe(
        filter((event) => event instanceof RoutesRecognized),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const recognized = event as RoutesRecognized;
        const nextPageHostKey = this.getPrimaryPageHostKey(
          recognized.state.root,
        );
        if (nextPageHostKey !== this.currentPageHostKey) {
          this.clear();
        }
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPageHostKey = this.getPrimaryPageHostKey(
          this.router.routerState.snapshot.root,
        );
      });
  }

  /**
   * Sets the ancestor chain for the current page, nearest entity first (e.g.
   * a line passes `[sector, crag, region]`). Uses the nearest ancestor with a
   * non-empty `rulesTitle` for the alert title, dialog body, and read-status.
   * No-ops if the same ancestor chain (ids + titles + timestamps) was already
   * set, so re-showing on every navigation within the same entity set is
   * avoided.
   */
  setContext(entities: RulesEntity[]): void {
    const withRules = entities.filter((entity) => !!entity.rules);

    const contextKey = withRules
      .map(
        (entity) =>
          `${entity.entityType}:${entity.id}:${entity.rulesTitle ?? ''}:${entity.rulesUpdatedAt ?? ''}`,
      )
      .join('|');
    if (contextKey === this.lastContextKey) {
      return;
    }
    this.lastContextKey = contextKey;

    // Nearest-first order is preserved by the caller; first with a title wins.
    const nearest = withRules.find((entity) => !!entity.rulesTitle) ?? null;
    this.emphasizedEntities = nearest ? [nearest] : [];

    if (!nearest) {
      this.stateSubject.next({
        visible: false,
        title: null,
        updatedSinceLastView: false,
        rulesSections: [],
      });
      return;
    }

    const title = nearest.rulesTitle;

    this.rulesReadStatusService
      .getStatus(nearest.entityType, nearest.id)
      .subscribe((status) => {
        // Guard against a stale response landing after the context moved on.
        if (contextKey !== this.lastContextKey) {
          return;
        }
        const acknowledgedUpdatedAt = status?.acknowledgedUpdatedAt ?? null;
        const updatedSinceLastView = isRulesUpdatedSinceLastView(
          acknowledgedUpdatedAt,
          nearest.rulesUpdatedAt,
        );
        this.stateSubject.next({
          visible: isRulesUnread(acknowledgedUpdatedAt, nearest.rulesUpdatedAt),
          title,
          updatedSinceLastView,
          rulesSections: [
            {
              level: LEVEL_BY_ENTITY_TYPE[nearest.entityType],
              title: nearest.name,
              rules: nearest.rules as string,
              updatedAt: nearest.rulesUpdatedAt,
              updatedSinceLastView,
            },
          ],
        });
      });
  }

  /** Marks the nearest emphasized ancestor as read and hides the alert. */
  markRead(): void {
    if (!this.emphasizedEntities.length) {
      return;
    }
    const refs = this.emphasizedEntities.map((entity) => ({
      entityType: entity.entityType,
      entityId: entity.id,
      acknowledgedUpdatedAt: entity.rulesUpdatedAt,
    }));
    // Allow a later setContext with the same ancestor chain to re-read status
    // from the updated cache/localStorage instead of no-op'ing.
    this.lastContextKey = null;
    this.rulesReadStatusService.markRead(refs).subscribe();
    this.patch({ visible: false, updatedSinceLastView: false });
  }

  /**
   * Marks a specific entity's rules as read (e.g. when its rules tab is
   * opened). Hides the alert when that entity is the one currently driving it.
   */
  markEntityRead(
    entityType: RulesEntityType,
    entityId: string,
    acknowledgedUpdatedAt: string | null,
  ): void {
    this.rulesReadStatusService
      .markRead([{ entityType, entityId, acknowledgedUpdatedAt }])
      .subscribe();
    if (
      this.emphasizedEntities.some(
        (entity) => entity.entityType === entityType && entity.id === entityId,
      )
    ) {
      this.patch({ visible: false, updatedSinceLastView: false });
    }
  }

  private clear(): void {
    this.lastContextKey = null;
    this.emphasizedEntities = [];
    this.stateSubject.next({ ...initialState });
  }

  private patch(partial: Partial<RulesAlertState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...partial,
    });
  }

  /** Copied from `PageTitleService` to detect real page (component) changes. */
  private getPrimaryPageHostKey(root: ActivatedRouteSnapshot): string {
    let hostRoute: ActivatedRouteSnapshot | null = null;

    const visit = (route: ActivatedRouteSnapshot) => {
      if (this.routeDefinesPageHost(route)) {
        hostRoute = route;
      }

      for (const child of route.children) {
        if (child.outlet === PRIMARY_OUTLET) {
          visit(child);
        }
      }
    };

    visit(root);

    if (!hostRoute) {
      return '';
    }

    return (hostRoute as ActivatedRouteSnapshot).pathFromRoot
      .map((segment) => segment.routeConfig?.path ?? '')
      .join('/');
  }

  private routeDefinesPageHost(route: ActivatedRouteSnapshot): boolean {
    const config = route.routeConfig;
    return !!(config?.component || config?.loadComponent);
  }
}
