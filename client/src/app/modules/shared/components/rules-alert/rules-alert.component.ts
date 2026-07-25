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
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { filter } from 'rxjs/operators';
import {
  RulesAlertSection,
  RulesAlertService,
  RulesAlertState,
} from '../../../../services/core/rules-alert.service';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';

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
  ],
})
export class RulesAlertComponent implements OnInit {
  protected rulesAlertService = inject(RulesAlertService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

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

  protected read(): void {
    this.rulesAlertService.markRead();
  }

  protected readMore(state: RulesAlertState): void {
    this.dialogSections = state.rulesSections;
    this.dialogOpen = true;
  }

  protected confirmRead(): void {
    this.dialogOpen = false;
    this.rulesAlertService.markRead();
  }

  private computeIsRulesRoute(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] === 'rules';
  }
}
