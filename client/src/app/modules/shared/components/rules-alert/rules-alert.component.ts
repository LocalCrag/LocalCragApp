import { AsyncPipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { filter } from 'rxjs/operators';
import { toastNotification } from '../../../../ngrx/actions/notifications.actions';
import {
  RulesAlertLevel,
  RulesAlertSection,
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

/**
 * Warning alert shown below the page title whenever a moderator-configured
 * `rulesTitle` on the nearest emphasized ancestor (sector/crag/region) is
 * unread. Hidden entirely on `/rules` tabs, where the rules are already the
 * page content.
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
  public dialogSections: RulesAlertSection[] = [];
  public isRulesRoute = false;

  ngOnInit(): void {
    this.isRulesRoute = this.computeIsRulesRoute(this.router.url);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.isRulesRoute = this.computeIsRulesRoute(this.router.url);
        if (this.isRulesRoute) {
          this.dialogOpen = false;
        }
      });
  }

  protected showAlert(state: RulesAlertState): boolean {
    return state.visible && !this.isRulesRoute;
  }

  protected read(state: RulesAlertState): void {
    this.toastThanks(state.rulesSections[0]?.level);
    this.rulesAlertService.markRead();
  }

  protected readMore(state: RulesAlertState): void {
    this.dialogSections = state.rulesSections;
    this.dialogOpen = true;
  }

  protected confirmRead(): void {
    const level = this.dialogSections[0]?.level;
    this.dialogOpen = false;
    this.rulesAlertService.markRead();
    this.toastThanks(level);
  }

  private toastThanks(level: RulesAlertLevel | undefined): void {
    if (level) {
      this.store.dispatch(toastNotification(THANKS_TOAST_BY_LEVEL[level]));
    }
  }

  private computeIsRulesRoute(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] === 'rules';
  }
}
