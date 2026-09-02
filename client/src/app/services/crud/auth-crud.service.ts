import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { LoginResponse } from '../../models/login-response';
import { map } from 'rxjs/operators';

/**
 * A simple response that only contains a message.
 */
export interface MessageResponse {
  message: string;
}

/**
 * A CRUD service that performs authorization requests.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthCrudService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  /**
   * Performs a login HTTP request.
   *
   * @param email Email to log in with.
   * @param password Password to log in with.
   * @return Returns an Observable that resolves to a login response.
   */
  public login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post(this.api.auth.login(), { email, password })
      .pipe(map((res) => LoginResponse.deserialize(res)));
  }

  /**
   * Ends the current session.
   *
   * @return Observable that resolves to a message response.
   */
  public logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.api.auth.logout(), null);
  }

  /**
   * Returns the current session user, or errors with 401 if unauthenticated.
   *
   * @return Observable that resolves to a login-style response with user.
   */
  public getMe(): Observable<LoginResponse> {
    return this.http
      .get(this.api.auth.me())
      .pipe(map((res) => LoginResponse.deserialize(res)));
  }

  /**
   * Requests a reset password mail.
   *
   * @param email Email to identify the user with
   * @return Returns an Observable that resolves to a message response.
   */
  public forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.api.auth.forgotPassword(), {
      email,
    });
  }

  /**
   * Requests a reset password mail.
   *
   * @param newPassword New password for the user.
   * @param resetPasswordHash Hash to validate that the user actually requested to reset the password.
   * @return Returns an Observable that resolves to a login response.
   */
  public resetPassword(
    newPassword: string,
    resetPasswordHash: string,
  ): Observable<LoginResponse> {
    return this.http
      .post(this.api.auth.resetPassword(), { newPassword, resetPasswordHash })
      .pipe(map((res) => LoginResponse.deserialize(res)));
  }

  /**
   * Changes a user's password.
   *
   * @param oldPassword The old password.
   * @param newPassword The new password.
   */
  public changePassword(
    oldPassword: string,
    newPassword: string,
  ): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(this.api.auth.changePassword(), {
      oldPassword,
      newPassword,
    });
  }
}
