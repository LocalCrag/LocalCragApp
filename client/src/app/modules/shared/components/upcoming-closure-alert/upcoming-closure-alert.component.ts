import { Component, Input, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ClosureReasonAlert,
  formatClosureScheduleRange,
} from '../../../../models/closure-reason-alert';
import { parseLocalCalendarDate } from '../../../../utility/local-calendar-date';

@Component({
  selector: 'lc-upcoming-closure-alert',
  imports: [MessageModule, TranslocoDirective],
  templateUrl: './upcoming-closure-alert.component.html',
  styleUrl: './upcoming-closure-alert.component.scss',
})
export class UpcomingClosureAlertComponent {
  @Input() warnings: ClosureReasonAlert[] = [];

  private translocoService = inject(TranslocoService);

  formatStartsOn(startsOn: string): string {
    const date = parseLocalCalendarDate(startsOn);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  warningText(warning: ClosureReasonAlert): string {
    const date = warning.startsOn ? this.formatStartsOn(warning.startsOn) : '';
    const range = formatClosureScheduleRange(warning);
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
