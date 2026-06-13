import { Component, Input, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ClosureReasonAlert,
  formatClosureScheduleRange,
} from '../../../../models/closure-reason-alert';

@Component({
  selector: 'lc-closed-spot-alert',
  imports: [MessageModule, TranslocoDirective],
  templateUrl: './closed-spot-alert.component.html',
  styleUrl: './closed-spot-alert.component.scss',
})
export class ClosedSpotAlertComponent {
  @Input() reason: string | null = null;
  @Input() reasons: ClosureReasonAlert[] | null = null;

  private translocoService = inject(TranslocoService);

  get displayAlerts(): ClosureReasonAlert[] {
    if (this.reasons?.length) {
      return this.reasons;
    }
    if (this.reason?.trim()) {
      const alert = new ClosureReasonAlert();
      alert.reason = this.reason.trim();
      return [alert];
    }
    return [new ClosureReasonAlert()];
  }

  alertText(alert: ClosureReasonAlert): string {
    const range = formatClosureScheduleRange(alert);
    const reason = alert.reason?.trim() || null;

    if (reason && range) {
      return this.translocoService.translate(
        'closedSpotAlert.closedWithReasonAndRange',
        {
          reason,
          range,
        },
      );
    }
    if (reason) {
      return this.translocoService.translate(
        'closedSpotAlert.closedWithReason',
        {
          reason,
        },
      );
    }
    if (range) {
      return this.translocoService.translate(
        'closedSpotAlert.closedWithRange',
        {
          range,
        },
      );
    }
    return this.translocoService.translate(
      'closedSpotAlert.closedWithoutReason',
    );
  }
}
