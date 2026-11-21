import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

export interface AdminMessageDialogData {
  title: string;
  text: string;
}

@Component({
  selector: 'lc-admin-message-dialog',
  imports: [HlmButton, TranslocoDirective],
  templateUrl: './admin-message-dialog.component.html',
  styleUrl: './admin-message-dialog.component.scss',
})
export class AdminMessageDialogComponent {
  private readonly dialogContext =
    injectBrnDialogContext<AdminMessageDialogData>();
  private ref = inject(BrnDialogRef);

  public readonly title: string = this.dialogContext.title ?? '';
  public readonly text: string = this.dialogContext.text ?? '';

  public close(): void {
    this.ref.close();
  }
}
