import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ApiService} from '../core/api.service';
import {HttpBackendClientService} from '../core/http-backend-client.service';
import {LoginResponse} from '../../models/login-response';
import {map} from 'rxjs/operators';

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
  constructor(
    private httpBackend: HttpBackendClientService,
    private http: HttpClient,
    private api: ApiService,
  ) {}

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
   * Performs a login refresh HTTP request.
   *
   * @param refreshToken Current refresh token.
   * @return Returns an Observable that resolves to a login response.
   */
  public loginRefresh(refreshToken: string): Observable<LoginResponse> {
    const headers = this.getRefreshTokenHeaders(refreshToken);
    return this.httpBackend
      .post(this.api.auth.loginRefresh(), null, { headers })
      .pipe(map((res) => LoginResponse.deserialize(res)));
  }

  /**
   * Performs an access token logout. This will blacklist the access token.
   *
   * @param  accessToken Current access token.
   * @return Observable that resolves to a message response.
   */
  public logoutAccess(accessToken: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.api.auth.logoutAccess(), null);
  }

  /**
   * Performs a refresh token logout. This will blacklist the refresh token.
   *
   * @param  refreshToken Current refresh token.
   * @return Observable that resolves to a message response.
   */
  public logoutRefresh(refreshToken: string): Observable<MessageResponse> {
    const headers = this.getRefreshTokenHeaders(refreshToken);
    return this.httpBackend.post<MessageResponse>(
      this.api.auth.logoutRefresh(),
      null,
      { headers },
    );
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

  /**
   * Returns http headers with a refresh token as bearer.
   *
   * @param refreshToken Refresh token that should be used in header.
   * @return Http headers.
   */
  private getRefreshTokenHeaders(refreshToken: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`,
      'Content-Type': 'application/json',
    });
  }
}
