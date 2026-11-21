import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { rootInject } from '../root-injector';

@Component({
  selector: 'lc-account-prompt-dialog',
  templateUrl: './account-prompt-dialog.component.html',
  styleUrl: './account-prompt-dialog.component.scss',
  imports: [TranslocoDirective, HlmButton],
})
export class AccountPromptDialogComponent {
  private ref = inject(BrnDialogRef);
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
  _dialogService: unknown,
  _translocoService: TranslocoService,
): void {
  rootInject(HlmDialogService).open(AccountPromptDialogComponent, {
    contentClass: 'max-w-md',
  });
}
