import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../models/user';
import { ApiService } from '../core/api.service';
import { MessageResponse } from './auth-crud.service';

export interface TotpSetupResponse {
  secret: string;
  otpauthUri: string;
  qrCode: string;
}

/**
 * Turns authenticator and email two-factor authentication on and off.
 */
@Injectable({
  providedIn: 'root',
})
export class TwoFactorService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  public startTotp(): Observable<TotpSetupResponse> {
    return this.http.post<TotpSetupResponse>(this.api.account.totp(), {});
  }

  public confirmTotp(code: string): Observable<User> {
    return this.http
      .post(this.api.account.totpConfirm(), { code })
      .pipe(map((payload) => User.deserialize(payload)));
  }

  public disableTotp(password: string | null): Observable<User> {
    return this.http
      .delete(this.api.account.totp(), { body: { password } })
      .pipe(map((payload) => User.deserialize(payload)));
  }

  public startEmail(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      this.api.account.emailTwoFactor(),
      {},
    );
  }

  public confirmEmail(code: string): Observable<User> {
    return this.http
      .post(this.api.account.emailTwoFactorConfirm(), { code })
      .pipe(map((payload) => User.deserialize(payload)));
  }

  public disableEmail(password: string | null): Observable<User> {
    return this.http
      .delete(this.api.account.emailTwoFactor(), { body: { password } })
      .pipe(map((payload) => User.deserialize(payload)));
  }
}
