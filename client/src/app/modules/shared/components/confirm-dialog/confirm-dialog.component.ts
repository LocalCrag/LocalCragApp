import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

export interface ConfirmDialogContext {
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  destructive: boolean;
  accept?: () => void;
  reject?: () => void;
}

@Component({
  selector: 'lc-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButton],
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef);
  private readonly context = injectBrnDialogContext<ConfirmDialogContext>();

  readonly message = this.context.message;
  readonly acceptLabel = this.context.acceptLabel;
  readonly rejectLabel = this.context.rejectLabel;
  readonly destructive = this.context.destructive;

  accept(): void {
    const action = this.context.accept;
    this.dialogRef.close();
    action?.();
  }

  reject(): void {
    const action = this.context.reject;
    this.dialogRef.close();
    action?.();
  }
}
