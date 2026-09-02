import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Reads a cookie by name from document.cookie.
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const encodedName = encodeURIComponent(name);
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey === encodedName || rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return null;
}

/**
 * Http interceptor that sends cookies (withCredentials) and CSRF tokens
 * for cookie-based session auth.
 */
@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  /**
   * Intercepts http requests: always sends credentials; for mutating methods
   * also sets X-CSRF-Token from the lc_csrf cookie when present.
   *
   * @param request request to intercept.
   * @param next Http handler for the request.
   * @return Returns an Observable that resolves to an http event.
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const method = request.method.toUpperCase();
    const needsCsrf =
      method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    const csrfToken = needsCsrf ? getCookie('lc_csrf') : null;

    request = request.clone({
      withCredentials: true,
      ...(csrfToken
        ? {
            setHeaders: {
              'X-CSRF-Token': csrfToken,
            },
          }
        : {}),
    });

    return next.handle(request);
  }
}
