import { Component, Input, inject } from '@angular/core';
import { HlmAlert } from '@spartan-ng/helm/alert';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ClosureReasonAlert,
  closureAlertMessage,
} from '../../../../models/closure-reason-alert';
import { LanguageService } from '../../../../services/core/language.service';

@Component({
  selector: 'lc-closed-spot-alert',
  imports: [HlmAlert, TranslocoDirective],
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
    return closureAlertMessage(
      alert,
      (key, params) => this.translocoService.translate(key, params),
      this.languageService.calculatedLanguage,
    );
  }
}
