import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

export type ClipboardToastMessages = {
  successSummary: string;
  successDetail: string;
  errorSummary?: string;
  errorDetail?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  private defaultToastMessages(): ClipboardToastMessages {
    return {
      successSummary: this.translocoService.translate(
        marker('clipboardSuccessToastTitle'),
      ),
      successDetail: this.translocoService.translate(
        marker('clipboardSuccessToastDescription'),
      ),
      errorSummary: this.translocoService.translate(
        marker('clipboardErrorToastTitle'),
      ),
      errorDetail: this.translocoService.translate(
        marker('clipboardErrorToastDescription'),
      ),
    };
  }

  private showSuccess(messages: ClipboardToastMessages) {
    this.messageService.add({
      severity: 'success',
      summary: messages.successSummary,
      detail: messages.successDetail,
    });
  }

  private showError(messages: ClipboardToastMessages) {
    this.messageService.add({
      severity: 'error',
      summary:
        messages.errorSummary ??
        this.translocoService.translate(marker('clipboardErrorToastTitle')),
      detail:
        messages.errorDetail ??
        this.translocoService.translate(
          marker('clipboardErrorToastDescription'),
        ),
    });
  }

  private fallbackCopyTextToClipboard(
    text: string,
    messages: ClipboardToastMessages,
  ) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.showSuccess(messages);
    } catch (_err) {
      this.showError(messages);
    }

    document.body.removeChild(textArea);
  }

  public copyTextToClipboard(
    text: string,
    toastMessages?: ClipboardToastMessages,
  ) {
    const messages = toastMessages ?? this.defaultToastMessages();
    if (!navigator.clipboard) {
      this.fallbackCopyTextToClipboard(text, messages);
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => this.showSuccess(messages),
      () => this.showError(messages),
    );
  }
}
