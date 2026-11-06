import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';
import { Store } from '@ngrx/store';
import { updateAccountSettings } from '../../../ngrx/actions/auth.actions';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AppState } from '../../../ngrx/reducers';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { PasskeyService } from '../../../services/crud/passkey.service';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { parseServerUtcDate } from '../../../utility/parse-server-utc-date';
import {
  PasskeyCredentialSummary,
  createPasskey,
  isPasskeyCancellation,
  isPasskeySupported,
} from '../../../utility/webauthn';

@Component({
  selector: 'lc-account-passkeys',
  templateUrl: './account-passkeys.component.html',
  styleUrl: './account-passkeys.component.scss',
  imports: [
    TranslocoDirective,
    DividerModule,
    Button,
    Message,
    InputText,
    Tooltip,
    ConfirmDialogModule,
    DatePipe,
  ],
  providers: [ConfirmationService],
})
export class AccountPasskeysComponent implements OnInit {
  public passkeys: PasskeyCredentialSummary[] = [];
  public supported = isPasskeySupported();
  public loading = false;
  public adding = false;
  public removingPassword = false;
  public hasPassword = true;
  public editingId: string | null = null;
  public draftName = '';

  private passkeyService = inject(PasskeyService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private transloco = inject(TranslocoService);
  private store = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.store
      .select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.hasPassword = user?.hasPassword !== false;
      });
    if (this.supported) {
      this.load();
    }
  }

  public lastUsed(passkey: PasskeyCredentialSummary): Date | null {
    return parseServerUtcDate(passkey.lastUsedAt);
  }

  public cannotDelete(): boolean {
    return !this.hasPassword && this.passkeys.length <= 1;
  }

  public setPassword(): void {
    void this.router.navigate(['/change-password']);
  }

  public startRename(passkey: PasskeyCredentialSummary): void {
    this.editingId = passkey.id;
    this.draftName = passkey.name;
  }

  public async saveRename(passkey: PasskeyCredentialSummary): Promise<void> {
    const name = this.draftName.trim();
    if (!name) {
      return;
    }
    try {
      const updated = await firstValueFrom(
        this.passkeyService.rename(passkey.id, name),
      );
      this.passkeys = this.passkeys.map((item) =>
        item.id === updated.id ? updated : item,
      );
      this.editingId = null;
      this.store.dispatch(toastNotification('PASSKEY_RENAMED'));
    } catch {
      this.store.dispatch(toastNotification('PASSKEY_ERROR'));
    }
  }

  public async add(): Promise<void> {
    this.adding = true;
    try {
      const options = await firstValueFrom(
        this.passkeyService.registerOptions(),
      );
      const credential = await createPasskey(options);
      const name = this.transloco.translate(
        marker('accountPasskeys.defaultName'),
      );
      await firstValueFrom(
        this.passkeyService.registerVerify(credential, name),
      );
      this.store.dispatch(toastNotification('PASSKEY_ADDED'));
      this.load();
    } catch (error) {
      if (!isPasskeyCancellation(error)) {
        this.store.dispatch(toastNotification('PASSKEY_ERROR'));
      }
    } finally {
      this.adding = false;
    }
  }

  public confirmDelete(passkey: PasskeyCredentialSummary): void {
    this.confirmationService.confirm({
      header: this.transloco.translate(
        marker('accountPasskeys.confirmDeleteTitle'),
      ),
      message: this.transloco.translate(
        marker('accountPasskeys.confirmDelete'),
      ),
      acceptLabel: this.transloco.translate(
        marker('accountPasskeys.yesDelete'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('accountPasskeys.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.delete(passkey);
      },
    });
  }

  private load(): void {
    this.loading = true;
    this.passkeyService.list().subscribe({
      next: (passkeys) => {
        this.passkeys = passkeys;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.store.dispatch(toastNotification('PASSKEY_ERROR'));
      },
    });
  }

  public confirmRemovePassword(): void {
    this.confirmationService.confirm({
      header: this.transloco.translate(
        marker('accountPasskeys.confirmRemovePasswordTitle'),
      ),
      message: this.transloco.translate(
        marker('accountPasskeys.confirmRemovePassword'),
      ),
      acceptLabel: this.transloco.translate(
        marker('accountPasskeys.yesRemovePassword'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('accountPasskeys.keepPassword'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.removePassword();
      },
    });
  }

  private delete(passkey: PasskeyCredentialSummary): void {
    this.passkeyService.delete(passkey.id).subscribe({
      next: () => {
        this.passkeys = this.passkeys.filter((item) => item.id !== passkey.id);
        this.store.dispatch(toastNotification('PASSKEY_REMOVED'));
      },
      error: (error) => {
        if (error?.error?.message !== 'CANNOT_REMOVE_LAST_PASSKEY') {
          this.store.dispatch(toastNotification('PASSKEY_ERROR'));
        }
      },
    });
  }

  private removePassword(): void {
    this.removingPassword = true;
    this.passkeyService.removePassword().subscribe({
      next: (user) => {
        this.removingPassword = false;
        this.store.dispatch(updateAccountSettings({ user }));
        this.store.dispatch(toastNotification('PASSWORD_REMOVED'));
      },
      error: (error) => {
        this.removingPassword = false;
        if (error?.error?.message !== 'CANNOT_REMOVE_PASSWORD') {
          this.store.dispatch(toastNotification('PASSKEY_ERROR'));
        }
      },
    });
  }
}
