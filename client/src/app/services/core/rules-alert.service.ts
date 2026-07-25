import { DestroyRef, Injectable, inject } from '@angular/core';
import { NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Crag } from '../../models/crag';
import { Region } from '../../models/region';
import { Sector } from '../../models/sector';
import { getPrimaryPageHostKey } from '../../utility/router/primary-page-host-key';
import {
  RulesEntityType,
  RulesReadStatusService,
} from '../crud/rules-read-status.service';
import {
  isRulesUnread,
  isRulesUpdatedSinceLastView,
} from '../crud/rules-read-status.util';

/** Ancestor models for the rules alert on a topo page. */
export interface RulesAlertContext {
  sector?: Sector;
  crag?: Crag;
  region?: Region;
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
  updatedAt: Date | null;
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

/** Internal pairing of a topo model with its API entity type. */
interface EmphasizedEntity {
  entityType: RulesEntityType;
  entity: Sector | Crag | Region;
}

/**
 * Computes rules-alert visibility/content from ancestor topo models
 * (region/crag/sector). Each emphasized unread ancestor gets its own alert.
 * Mirrors `PageTitleService`'s BehaviorSubject + clear-on-page-host-change
 * pattern so stale context never leaks between unrelated pages.
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
  private emphasizedEntities: EmphasizedEntity[] = [];

  constructor() {
    this.currentPageHostKey = getPrimaryPageHostKey(
      this.router.routerState.snapshot.root,
    );

    this.router.events
      .pipe(
        filter((event) => event instanceof RoutesRecognized),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const recognized = event as RoutesRecognized;
        const nextPageHostKey = getPrimaryPageHostKey(recognized.state.root);
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
        this.currentPageHostKey = getPrimaryPageHostKey(
          this.router.routerState.snapshot.root,
        );
      });
  }

  /**
   * Sets the ancestor models for the current page. Builds one alert per
   * emphasized (non-empty `rulesTitle`) unread ancestor.
   */
  setContext(context: RulesAlertContext): void {
    const entries = this.contextToEntries(context);
    const withRules = entries.filter(({ entity }) => !!entity.rules);

    const contextKey = withRules
      .map(
        ({ entityType, entity }) =>
          `${entityType}:${entity.id}:${entity.rulesTitle ?? ''}:${entity.rulesUpdatedAt?.getTime() ?? ''}`,
      )
      .join('|');
    if (contextKey === this.lastContextKey) {
      return;
    }
    this.lastContextKey = contextKey;

    const emphasized = withRules.filter(({ entity }) => !!entity.rulesTitle);
    this.emphasizedEntities = emphasized;

    if (!emphasized.length) {
      this.stateSubject.next({ alerts: [] });
      return;
    }

    forkJoin(
      emphasized.map((item) =>
        this.rulesReadStatusService
          .getStatus(item.entityType, item.entity.id)
          .pipe(map((status) => ({ item, status }))),
      ),
    ).subscribe((results) => {
      if (contextKey !== this.lastContextKey) {
        return;
      }
      const alerts: RulesAlertItem[] = results
        .filter(({ item, status }) =>
          isRulesUnread(
            status?.acknowledgedUpdatedAt,
            item.entity.rulesUpdatedAt,
          ),
        )
        .map(({ item, status }) => ({
          entityType: item.entityType,
          entityId: item.entity.id,
          level: LEVEL_BY_ENTITY_TYPE[item.entityType],
          alertTitle: item.entity.rulesTitle as string,
          entityName: item.entity.name,
          rules: item.entity.rules as string,
          updatedAt: item.entity.rulesUpdatedAt,
          updatedSinceLastView: isRulesUpdatedSinceLastView(
            status?.acknowledgedUpdatedAt,
            item.entity.rulesUpdatedAt,
          ),
        }))
        .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

      this.stateSubject.next({ alerts });
    });
  }

  /** Marks one emphasized entity as read and removes its alert. */
  markRead(entityType: RulesEntityType, entityId: string): void {
    const item = this.emphasizedEntities.find(
      (entry) =>
        entry.entityType === entityType && entry.entity.id === entityId,
    );
    if (!item) {
      return;
    }
    this.lastContextKey = null;
    this.rulesReadStatusService
      .markRead([
        {
          entityType,
          entityId,
          acknowledgedUpdatedAt: item.entity.rulesUpdatedAt,
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
    acknowledgedUpdatedAt: Date | null,
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

  private contextToEntries(context: RulesAlertContext): EmphasizedEntity[] {
    const entries: EmphasizedEntity[] = [];
    if (context.sector) {
      entries.push({ entityType: 'Sector', entity: context.sector });
    }
    if (context.crag) {
      entries.push({ entityType: 'Crag', entity: context.crag });
    }
    if (context.region) {
      entries.push({ entityType: 'Region', entity: context.region });
    }
    return entries;
  }

  private clear(): void {
    this.lastContextKey = null;
    this.emphasizedEntities = [];
    this.stateSubject.next({ ...initialState });
  }
}
