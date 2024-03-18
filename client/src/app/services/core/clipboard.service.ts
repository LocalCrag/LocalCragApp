import {Injectable} from '@angular/core';
import {MessageService} from 'primeng/api';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {

  constructor(private messageService: MessageService,
              private translocoService: TranslocoService,) {
  }

  private fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate(marker('clipboardSuccessToastTitle')),
        detail: this.translocoService.translate(marker('clipboardSuccessToastDescription')),
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate(marker('clipboardErrorToastTitle')),
        detail: this.translocoService.translate(marker('clipboardErrorToastDescription')),
      });
    }

    document.body.removeChild(textArea);
  }

  public copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      this.fallbackCopyTextToClipboard(text);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate(marker('clipboardSuccessToastTitle')),
        detail: this.translocoService.translate(marker('clipboardSuccessToastDescription')),
      });
    }, () => {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate(marker('clipboardErrorToastTitle')),
        detail: this.translocoService.translate(marker('clipboardErrorToastDescription')),
      });
    });
  }

}
