import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginResponse } from '../../models/login-response';
import { User } from '../../models/user';
import { ApiService } from '../core/api.service';
import { PasskeyCredentialSummary } from '../../utility/webauthn';

/**
 * HTTP calls for passkey registration, sign-in, and account management.
 */
@Injectable({
  providedIn: 'root',
})
export class PasskeyService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  public loginOptions(): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      this.api.auth.passkeyLoginOptions(),
      {},
    );
  }

  public loginVerify(
    credential: Record<string, unknown>,
  ): Observable<LoginResponse> {
    return this.http
      .post(this.api.auth.passkeyLoginVerify(), { credential })
      .pipe(map((res) => LoginResponse.deserialize(res)));
  }

  public registerOptions(): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      this.api.auth.passkeyRegisterOptions(),
      {},
    );
  }

  public registerVerify(
    credential: Record<string, unknown>,
    name: string,
  ): Observable<PasskeyCredentialSummary> {
    return this.http.post<PasskeyCredentialSummary>(
      this.api.auth.passkeyRegisterVerify(),
      { credential, name },
    );
  }

  public list(): Observable<PasskeyCredentialSummary[]> {
    return this.http.get<PasskeyCredentialSummary[]>(this.api.auth.passkeys());
  }

  public delete(passkeyId: string): Observable<void> {
    return this.http.delete<void>(this.api.auth.passkey(passkeyId));
  }

  public rename(
    passkeyId: string,
    name: string,
  ): Observable<PasskeyCredentialSummary> {
    return this.http.patch<PasskeyCredentialSummary>(
      this.api.auth.passkey(passkeyId),
      { name },
    );
  }

  public signupOptions(profile: {
    firstname: string;
    lastname: string;
    email: string;
  }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      this.api.auth.passkeySignupOptions(),
      profile,
    );
  }

  public signupVerify(
    credential: Record<string, unknown>,
    name: string,
  ): Observable<LoginResponse> {
    return this.http
      .post(this.api.auth.passkeySignupVerify(), { credential, name })
      .pipe(map((res) => LoginResponse.deserialize(res)));
  }

  public removePassword(): Observable<User> {
    return this.http
      .delete(this.api.account.removePassword())
      .pipe(map((res) => User.deserialize(res)));
  }
}
