import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';

export interface ConfirmDialogOptions {
  /** Short heading. Defaults to the shared delete title. */
  title?: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
  destructive?: boolean;
  accept?: () => void;
  reject?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  private readonly dialogs = inject(HlmDialogService);
  private readonly transloco = inject(TranslocoService);

  open(options: ConfirmDialogOptions): void {
    this.dialogs.open(ConfirmDialogComponent, {
      title:
        options.title ??
        this.transloco.translate(marker('confirm.deleteTitle')),
      contentClass: 'sm:max-w-lg',
      context: {
        message: options.message,
        acceptLabel:
          options.acceptLabel ??
          this.transloco.translate(marker('confirm.yesDelete')),
        rejectLabel:
          options.rejectLabel ??
          this.transloco.translate(marker('confirm.cancel')),
        destructive: options.destructive ?? false,
        accept: options.accept,
        reject: options.reject,
      },
    });
  }
}
