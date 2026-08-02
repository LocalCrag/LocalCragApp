import { Component, Input, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ClosureReasonAlert,
  formatClosureScheduleRange,
} from '../../../../models/closure-reason-alert';
import { parseLocalCalendarDate } from '../../../../utility/local-calendar-date';
import { LanguageService } from '../../../../services/core/language.service';
import { DatePipe } from '../../pipes/date.pipe';

@Component({
  selector: 'lc-upcoming-closure-alert',
  imports: [MessageModule, TranslocoDirective],
  templateUrl: './upcoming-closure-alert.component.html',
  styleUrl: './upcoming-closure-alert.component.scss',
  providers: [DatePipe],
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
    const date = warning.startsOn ? this.formatStartsOn(warning.startsOn) : '';
    const range = formatClosureScheduleRange(
      warning,
      this.languageService.calculatedLanguage,
    );
    const reason = warning.reason?.trim() || null;

    if (reason && range) {
      return this.translocoService.translate(
        'closedSpotAlert.upcomingWithReasonAndRange',
        {
          date,
          reason,
          range,
        },
      );
    }
    if (reason) {
      return this.translocoService.translate(
        'closedSpotAlert.upcomingWithReason',
        {
          date,
          reason,
        },
      );
    }
    if (range) {
      return this.translocoService.translate(
        'closedSpotAlert.upcomingWithRange',
        {
          date,
          range,
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
