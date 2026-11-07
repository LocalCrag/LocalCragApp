import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Button } from 'primeng/button';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'lc-account-prompt-dialog',
  templateUrl: './account-prompt-dialog.component.html',
  styleUrl: './account-prompt-dialog.component.scss',
  imports: [TranslocoDirective, Button],
})
export class AccountPromptDialogComponent {
  private ref = inject(DynamicDialogRef);
  private router = inject(Router);

  goToLogin(): void {
    this.ref.close();
    void this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.ref.close();
    void this.router.navigate(['/register']);
  }
}

/** Asks a visitor to create an account instead of performing the action. */
export function openAccountPrompt(
  dialogService: DialogService,
  translocoService: TranslocoService,
): void {
  dialogService.open(AccountPromptDialogComponent, {
    modal: true,
    closable: true,
    dismissableMask: true,
    focusOnShow: false,
    header: translocoService.translate(marker('accountPrompt.title')),
    width: '28rem',
  });
}
