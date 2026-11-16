import { Injectable, inject } from '@angular/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { AdminMessagesService } from '../../../services/crud/admin-messages.service';
import {
  AdminMessageDialogComponent,
  AdminMessageDialogData,
} from './admin-message-dialog.component';

@Injectable()
export class AdminMessageDialogService {
  private dialogService = inject(HlmDialogService);
  private adminMessagesService = inject(AdminMessagesService);
  private translocoService = inject(TranslocoService);

  private openRef: BrnDialogRef | undefined;

  public open(data: AdminMessageDialogData): void {
    this.openRef?.close();
    this.openRef = this.dialogService.open(AdminMessageDialogComponent, {
      context: data,
      contentClass: 'admin-message-dialog-host sm:max-w-xl',
    });
  }

  public openById(
    messageId: string,
    fallback?: Partial<AdminMessageDialogData>,
  ): void {
    if (fallback?.title && fallback?.text) {
      this.open({ title: fallback.title, text: fallback.text });
      return;
    }
    this.adminMessagesService.getMessage(messageId).subscribe({
      next: (message) => {
        this.open({ title: message.title, text: message.text });
      },
      error: () => {
        this.open({
          title: this.translocoService.translate(
            marker('adminMessages.dialog.unavailableTitle'),
          ),
          text: this.translocoService.translate(
            marker('adminMessages.dialog.unavailableText'),
          ),
        });
      },
    });
  }
}
