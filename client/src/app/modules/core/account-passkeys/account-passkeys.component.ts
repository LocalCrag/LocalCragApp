import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
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
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert } from '@spartan-ng/helm/alert';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import {
  lucideCheck,
  lucideCloud,
  lucideKey,
  lucideLock,
  lucidePencil,
  lucidePlus,
  lucideShield,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';

@Component({
  selector: 'lc-account-passkeys',
  templateUrl: './account-passkeys.component.html',
  styleUrl: './account-passkeys.component.scss',
  imports: [
    NgIcon,
    HlmTooltip,
    HlmSeparator,
    HlmInput,
    HlmAlert,
    HlmButton,
    TranslocoDirective,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    provideIcons({
      lucideCheck,
      lucideCloud,
      lucideKey,
      lucideLock,
      lucidePencil,
      lucidePlus,
      lucideShield,
      lucideTrash2,
      lucideX,
    }),
  ],
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
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
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
    this.openConfirm(
      marker('accountPasskeys.confirmDeleteTitle'),
      marker('accountPasskeys.confirmDelete'),
      marker('accountPasskeys.yesDelete'),
      marker('accountPasskeys.noDontDelete'),
      () => this.delete(passkey),
    );
  }

  private openConfirm(
    titleKey: string,
    messageKey: string,
    acceptKey: string,
    rejectKey: string,
    accept: () => void,
  ): void {
    this.confirmDialog.open({
      title: this.transloco.translate(titleKey),
      message: this.transloco.translate(messageKey),
      acceptLabel: this.transloco.translate(acceptKey),
      rejectLabel: this.transloco.translate(rejectKey),
      destructive: true,
      accept,
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
    this.openConfirm(
      marker('accountPasskeys.confirmRemovePasswordTitle'),
      marker('accountPasskeys.confirmRemovePassword'),
      marker('accountPasskeys.yesRemovePassword'),
      marker('accountPasskeys.keepPassword'),
      () => this.removePassword(),
    );
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
