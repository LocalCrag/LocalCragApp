import { AsyncPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { filter } from 'rxjs/operators';
import { toastNotification } from '../../../../ngrx/actions/notifications.actions';
import {
  RulesAlertItem,
  RulesAlertLevel,
  RulesAlertService,
  RulesAlertState,
} from '../../../../services/core/rules-alert.service';
import { NotificationKey } from '../../../../utility/notifications';
import { DatePipe } from '../../pipes/date.pipe';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';

const THANKS_TOAST_BY_LEVEL: Record<RulesAlertLevel, NotificationKey> = {
  crag: 'RULES_READ_THANKS_CRAG',
  sector: 'RULES_READ_THANKS_SECTOR',
  region: 'RULES_READ_THANKS_REGION',
};

const SECTION_HEADER_KEY: Record<RulesAlertLevel, string> = {
  sector: 'sectorRules',
  crag: 'cragRules',
  region: 'regionRules',
};

/**
 * Warning alerts shown below the page title — one per emphasized unread
 * ancestor (sector / crag / region). On a `/rules` tab, only the alert for
 * that same entity level is hidden; parent/sibling levels still show.
 */
@Component({
  selector: 'lc-rules-alert',
  templateUrl: './rules-alert.component.html',
  styleUrl: './rules-alert.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [
    AsyncPipe,
    TranslocoDirective,
    ButtonModule,
    DialogModule,
    SanitizeHtmlPipe,
    DatePipe,
  ],
})
export class RulesAlertComponent implements OnInit {
  protected rulesAlertService = inject(RulesAlertService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);

  public dialogOpen = false;
  public dialogAlert: RulesAlertItem | null = null;
  /** Level of the rules tab currently open, if any. */
  public activeRulesTabLevel: RulesAlertLevel | null = null;

  readonly sectionHeaderKey = SECTION_HEADER_KEY;

  ngOnInit(): void {
    this.activeRulesTabLevel = this.computeActiveRulesTabLevel(
      this.router.routerState.snapshot.root,
    );
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.activeRulesTabLevel = this.computeActiveRulesTabLevel(
          this.router.routerState.snapshot.root,
        );
        if (this.activeRulesTabLevel) {
          this.dialogOpen = false;
        }
      });
  }

  protected visibleAlerts(state: RulesAlertState): RulesAlertItem[] {
    if (!this.activeRulesTabLevel) {
      return state.alerts;
    }
    return state.alerts.filter(
      (alert) => alert.level !== this.activeRulesTabLevel,
    );
  }

  protected read(alert: RulesAlertItem): void {
    this.toastThanks(alert.level);
    this.rulesAlertService.markRead(alert.entityType, alert.entityId);
  }

  protected readMore(alert: RulesAlertItem): void {
    this.dialogAlert = alert;
    this.dialogOpen = true;
  }

  protected confirmRead(): void {
    const alert = this.dialogAlert;
    this.dialogOpen = false;
    this.dialogAlert = null;
    if (!alert) {
      return;
    }
    this.rulesAlertService.markRead(alert.entityType, alert.entityId);
    this.toastThanks(alert.level);
  }

  private toastThanks(level: RulesAlertLevel): void {
    this.store.dispatch(toastNotification(THANKS_TOAST_BY_LEVEL[level]));
  }

  /**
   * Reads `data.rulesAlertLevel` from the active route tree (including named
   * content outlets). Set on the region/crag/sector rules routes.
   */
  private computeActiveRulesTabLevel(
    root: ActivatedRouteSnapshot,
  ): RulesAlertLevel | null {
    let found: RulesAlertLevel | null = null;

    const visit = (route: ActivatedRouteSnapshot) => {
      const level = route.data?.['rulesAlertLevel'];
      if (level === 'region' || level === 'crag' || level === 'sector') {
        found = level;
      }
      for (const child of route.children) {
        visit(child);
      }
    };

    visit(root);
    return found;
  }
}
