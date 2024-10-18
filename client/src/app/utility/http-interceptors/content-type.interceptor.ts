import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiService} from '../../services/core/api.service';

/**
 * Http interceptor that adds content type headers to requests.
 */
@Injectable()
export class ContentTypeInterceptor implements HttpInterceptor {
  constructor(private api: ApiService) {}

  /**
   * Intercepts http requests and adds the content type header to them.
   *
   * @param request request to intercept.
   * @param next Http handler for the request.
   * @return Returns an Observable that resolves to an http event.
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (request.url !== this.api.uploader.uploadFile()) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json',
        },
      });
    }
    return next.handle(request);
  }
}
