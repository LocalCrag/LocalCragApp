import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Button } from 'primeng/button';

export type LiveSessionResolveResult = 'finish' | 'discard' | 'cancel';

/**
 * Finish / Discard / Cancel resolve UI for INST-07 (D-01).
 * Closing without Finish/Discard (mask, Escape, Cancel) ≡ Cancel (D-02).
 */
@Component({
  selector: 'lc-live-session-resolve-dialog',
  templateUrl: './live-session-resolve-dialog.component.html',
  standalone: true,
  imports: [TranslocoDirective, Button],
})
export class LiveSessionResolveDialogComponent {
  private ref = inject(DynamicDialogRef);

  finish(): void {
    this.ref.close('finish' satisfies LiveSessionResolveResult);
  }

  discard(): void {
    this.ref.close('discard' satisfies LiveSessionResolveResult);
  }

  cancel(): void {
    this.ref.close('cancel' satisfies LiveSessionResolveResult);
  }
}
