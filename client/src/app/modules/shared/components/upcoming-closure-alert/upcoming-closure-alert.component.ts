import { Component, Input, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { HlmAlert } from '@spartan-ng/helm/alert';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ClosureReasonAlert,
  escapeClosureMessageText,
  formatClosureScheduleRange,
} from '../../../../models/closure-reason-alert';
import { parseLocalCalendarDate } from '../../../../utility/local-calendar-date';
import { LanguageService } from '../../../../services/core/language.service';
import { DatePipe } from '../../pipes/date.pipe';

@Component({
  selector: 'lc-upcoming-closure-alert',
  imports: [HlmAlert, NgIcon, TranslocoDirective],
  providers: [provideIcons({ lucideInfo }), DatePipe],
  templateUrl: './upcoming-closure-alert.component.html',
  styleUrl: './upcoming-closure-alert.component.scss',
})
export class UpcomingClosureAlertComponent {
  @Input() warnings: ClosureReasonAlert[] = [];

  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private datePipe = inject(DatePipe);

  formatStartsOn(startsOn: string): string {
    return this.datePipe.transform(parseLocalCalendarDate(startsOn));
  }

  warningText(warning: ClosureReasonAlert): string {
    const date = escapeClosureMessageText(
      warning.startsOn ? this.formatStartsOn(warning.startsOn) : '',
    );
    const range = formatClosureScheduleRange(
      warning,
      this.languageService.calculatedLanguage,
    );
    const reason = warning.reason?.trim() || null;
    const safeRange = range ? escapeClosureMessageText(range) : null;
    const safeReason = reason ? escapeClosureMessageText(reason) : null;

    if (safeReason && safeRange) {
      return this.translocoService.translate(
        'closedSpotAlert.upcomingWithReasonAndRange',
        {
          date,
          reason: safeReason,
          range: safeRange,
        },
      );
    }
    if (safeReason) {
      return this.translocoService.translate(
        'closedSpotAlert.upcomingWithReason',
        {
          date,
          reason: safeReason,
        },
      );
    }
    if (safeRange) {
      return this.translocoService.translate(
        'closedSpotAlert.upcomingWithRange',
        {
          date,
          range: safeRange,
        },
      );
    }
    return this.translocoService.translate(
      'closedSpotAlert.upcomingWithoutReason',
      {
        date,
      },
    );
  }
}
