import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  PRIMARY_OUTLET,
  Router,
  RoutesRecognized,
} from '@angular/router';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { filter, map } from 'rxjs/operators';
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

/** One dismissible rules alert for a single emphasized entity. */
export interface RulesAlertItem {
  entityType: RulesEntityType;
  entityId: string;
  level: RulesAlertLevel;
  alertTitle: string;
  entityName: string;
  rules: string;
  updatedAt: string | null;
  updatedSinceLastView: boolean;
}

export interface RulesAlertState {
  alerts: RulesAlertItem[];
}

const initialState: RulesAlertState = {
  alerts: [],
};

const LEVEL_BY_ENTITY_TYPE: Record<RulesEntityType, RulesAlertLevel> = {
  Sector: 'sector',
  Crag: 'crag',
  Region: 'region',
};

const LEVEL_ORDER: Record<RulesAlertLevel, number> = {
  sector: 0,
  crag: 1,
  region: 2,
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
 * entities (region/crag/sector). Each emphasized unread ancestor gets its own
 * alert. Mirrors `PageTitleService`'s BehaviorSubject + clear-on-page-host-
 * change pattern so stale context never leaks between unrelated pages.
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
   * a line passes `[sector, crag, region]`). Builds one alert per emphasized
   * (non-empty `rulesTitle`) unread ancestor.
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

    const emphasized = withRules.filter((entity) => !!entity.rulesTitle);
    this.emphasizedEntities = emphasized;

    if (!emphasized.length) {
      this.stateSubject.next({ alerts: [] });
      return;
    }

    forkJoin(
      emphasized.map((entity) =>
        this.rulesReadStatusService
          .getStatus(entity.entityType, entity.id)
          .pipe(map((status) => ({ entity, status }))),
      ),
    ).subscribe((results) => {
      if (contextKey !== this.lastContextKey) {
        return;
      }
      const alerts: RulesAlertItem[] = results
        .filter(({ entity, status }) =>
          isRulesUnread(status?.acknowledgedUpdatedAt, entity.rulesUpdatedAt),
        )
        .map(({ entity, status }) => ({
          entityType: entity.entityType,
          entityId: entity.id,
          level: LEVEL_BY_ENTITY_TYPE[entity.entityType],
          alertTitle: entity.rulesTitle as string,
          entityName: entity.name,
          rules: entity.rules as string,
          updatedAt: entity.rulesUpdatedAt,
          updatedSinceLastView: isRulesUpdatedSinceLastView(
            status?.acknowledgedUpdatedAt,
            entity.rulesUpdatedAt,
          ),
        }))
        .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

      this.stateSubject.next({ alerts });
    });
  }

  /** Marks one emphasized entity as read and removes its alert. */
  markRead(entityType: RulesEntityType, entityId: string): void {
    const entity = this.emphasizedEntities.find(
      (item) => item.entityType === entityType && item.id === entityId,
    );
    if (!entity) {
      return;
    }
    this.lastContextKey = null;
    this.rulesReadStatusService
      .markRead([
        {
          entityType,
          entityId,
          acknowledgedUpdatedAt: entity.rulesUpdatedAt,
        },
      ])
      .subscribe();
    this.stateSubject.next({
      alerts: this.stateSubject.value.alerts.filter(
        (alert) =>
          !(alert.entityType === entityType && alert.entityId === entityId),
      ),
    });
  }

  /**
   * Marks a specific entity's rules as read (e.g. when its rules tab is
   * opened). Removes that entity's alert if present.
   */
  markEntityRead(
    entityType: RulesEntityType,
    entityId: string,
    acknowledgedUpdatedAt: string | null,
  ): void {
    this.rulesReadStatusService
      .markRead([{ entityType, entityId, acknowledgedUpdatedAt }])
      .subscribe();
    this.stateSubject.next({
      alerts: this.stateSubject.value.alerts.filter(
        (alert) =>
          !(alert.entityType === entityType && alert.entityId === entityId),
      ),
    });
  }

  private clear(): void {
    this.lastContextKey = null;
    this.emphasizedEntities = [];
    this.stateSubject.next({ ...initialState });
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
