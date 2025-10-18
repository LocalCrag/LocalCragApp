import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';

/**
 * A version of the http client that is not calling any interceptors.
 * See: https://github.com/angular/angular/issues/20203
 */
@Injectable({
  providedIn: 'root',
})
export class HttpBackendClientService extends HttpClient {
  constructor() {
    const handler = inject(HttpBackend);
    super(handler);
  }
}
