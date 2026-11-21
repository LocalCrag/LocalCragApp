import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

export interface ModerationMessageDialogData {
  message: string;
  ascentLink: string | null;
  unavailable?: boolean;
  title?: string;
}

@Component({
  selector: 'lc-moderation-message-dialog',
  imports: [HlmButton, TranslocoDirective],
  templateUrl: './moderation-message-dialog.component.html',
  styleUrl: './moderation-message-dialog.component.scss',
})
export class ModerationMessageDialogComponent {
  private readonly dialogContext =
    injectBrnDialogContext<ModerationMessageDialogData>();
  private ref = inject(BrnDialogRef);
  private router = inject(Router);

  public readonly title: string = this.dialogContext.title ?? '';
  public readonly message: string = this.dialogContext.message ?? '';
  public readonly ascentLink: string | null =
    this.dialogContext.ascentLink ?? null;

  public close(): void {
    this.ref.close();
  }

  public viewAscent(): void {
    const link = this.ascentLink;
    this.ref.close();
    if (link) {
      void this.router.navigateByUrl(link);
    }
  }
}
