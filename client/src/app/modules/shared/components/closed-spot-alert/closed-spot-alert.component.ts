import { Component, Input, inject } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ClosureReasonAlert,
  formatClosureScheduleRange,
} from '../../../../models/closure-reason-alert';
import { LanguageService } from '../../../../services/core/language.service';

@Component({
  selector: 'lc-closed-spot-alert',
  imports: [MessageModule, TranslocoDirective],
  templateUrl: './closed-spot-alert.component.html',
  styleUrl: './closed-spot-alert.component.scss',
})
export class ClosedSpotAlertComponent {
  @Input() reasons: ClosureReasonAlert[] | null = null;

  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);

  get displayAlerts(): ClosureReasonAlert[] {
    if (this.reasons?.length) {
      return this.reasons;
    }
    return [new ClosureReasonAlert()];
  }

  alertText(alert: ClosureReasonAlert): string {
    const range = formatClosureScheduleRange(
      alert,
      this.languageService.calculatedLanguage,
    );
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
