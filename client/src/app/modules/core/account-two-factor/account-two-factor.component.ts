import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { TranslocoDirective } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { firstValueFrom } from 'rxjs';
import { updateAccountSettings } from '../../../ngrx/actions/auth.actions';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AppState } from '../../../ngrx/reducers';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { User } from '../../../models/user';
import { TwoFactorService } from '../../../services/crud/two-factor.service';

type Method = 'totp' | 'email';

@Component({
  selector: 'lc-account-two-factor',
  templateUrl: './account-two-factor.component.html',
  styleUrl: './account-two-factor.component.scss',
  imports: [
    TranslocoDirective,
    FormsModule,
    DividerModule,
    Button,
    Message,
    InputText,
    Password,
  ],
})
export class AccountTwoFactorComponent implements OnInit {
  public hasPassword = true;
  public totpEnabled = false;
  public emailEnabled = false;
  public totpSecret: string | null = null;
  public totpQr: SafeUrl | null = null;
  public totpCode = '';
  public emailCode = '';
  public emailSetup = false;
  public disabling: Method | null = null;
  public disablePassword = '';
  public busy = false;

  private twoFactor = inject(TwoFactorService);
  private store = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.store
      .select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => this.applyUser(user));
  }

  public get passwordWithoutTwoFactor(): boolean {
    return this.hasPassword && !this.totpEnabled && !this.emailEnabled;
  }

  public async startTotp(): Promise<void> {
    this.busy = true;
    try {
      const setup = await firstValueFrom(this.twoFactor.startTotp());
      this.totpSecret = setup.secret;
      this.totpQr = this.sanitizer.bypassSecurityTrustUrl(setup.qrCode);
      this.totpCode = '';
    } finally {
      this.busy = false;
    }
  }

  public async confirmTotp(): Promise<void> {
    if (this.totpCode.trim().length !== 6) {
      return;
    }
    this.busy = true;
    try {
      const user = await firstValueFrom(
        this.twoFactor.confirmTotp(this.totpCode.trim()),
      );
      this.finish(user, 'TWO_FACTOR_ENABLED');
      this.totpSecret = null;
      this.totpQr = null;
    } catch {
      this.busy = false;
    }
  }

  public async startEmail(): Promise<void> {
    this.busy = true;
    try {
      await firstValueFrom(this.twoFactor.startEmail());
      this.emailSetup = true;
      this.emailCode = '';
      this.store.dispatch(toastNotification('TWO_FACTOR_EMAIL_SENT'));
    } finally {
      this.busy = false;
    }
  }

  public async confirmEmail(): Promise<void> {
    if (this.emailCode.trim().length !== 6) {
      return;
    }
    this.busy = true;
    try {
      const user = await firstValueFrom(
        this.twoFactor.confirmEmail(this.emailCode.trim()),
      );
      this.finish(user, 'TWO_FACTOR_ENABLED');
      this.emailSetup = false;
    } catch {
      this.busy = false;
    }
  }

  public async disable(method: Method): Promise<void> {
    if (this.hasPassword && !this.disablePassword) {
      this.disabling = method;
      return;
    }
    this.busy = true;
    try {
      const password = this.hasPassword ? this.disablePassword : null;
      const user = await firstValueFrom(
        method === 'totp'
          ? this.twoFactor.disableTotp(password)
          : this.twoFactor.disableEmail(password),
      );
      this.finish(user, 'TWO_FACTOR_DISABLED');
      this.disabling = null;
      this.disablePassword = '';
    } catch {
      this.busy = false;
    }
  }

  public cancelSetup(): void {
    this.totpSecret = null;
    this.totpQr = null;
    this.totpCode = '';
    this.emailSetup = false;
    this.emailCode = '';
    this.disabling = null;
    this.disablePassword = '';
  }

  private applyUser(user: User | null): void {
    this.hasPassword = user?.hasPassword !== false;
    this.totpEnabled = user?.totpEnabled === true;
    this.emailEnabled = user?.emailTwoFactorEnabled === true;
  }

  private finish(
    user: User,
    notification: 'TWO_FACTOR_ENABLED' | 'TWO_FACTOR_DISABLED',
  ): void {
    this.busy = false;
    this.applyUser(user);
    this.store.dispatch(updateAccountSettings({ user }));
    this.store.dispatch(toastNotification(notification));
  }
}
