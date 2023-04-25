import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';

/**
 * Wrapper of the http client that maps errors to simple strings for easier handling.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorMappingHttpService {

  constructor(private http: HttpClient) {
  }

  /**
   * Maps an http error to a string observable with the error message.
   *
   * @param error Error to map to string.
   * @return Observable that resolves to an error message string for further handling.
   */
  private static mapError(error: any): Observable<string | any> {
    if (error.error['labnodeErrCode']) {
      return throwError(error.error['labnodeErrCode']);
    }
    if (error.error['message']) {
      return throwError(error.error['message']);
    }
    return throwError('UNKNOWN_ERROR');
  }

  /**
   * Performs a http post request.
   *
   * @param url Request URL.
   * @param body Request body.
   * @return Observable of the body of type T.
   */
  public post<T>(url: string, body: any) {
    return this.http.post<T>(url, body).pipe(
      catchError(error => ErrorMappingHttpService.mapError(error))
    );
  }

  /**
   * Performs a http put request.
   *
   * @param url Request URL.
   * @param body Request body.
   * @return Observable of the body of type T.
   */
  public put<T>(url: string, body: any) {
    return this.http.put<T>(url, body).pipe(
      catchError(error => ErrorMappingHttpService.mapError(error))
    );
  }

  /**
   * Performs a http get request.
   *
   * @param url Request URL.
   * @return Observable of the body of type T.
   */
  public get<T>(url: string) {
    return this.http.get<T>(url).pipe(
      catchError(error => ErrorMappingHttpService.mapError(error))
    );
  }

  /**
   * Performs a http delete request.
   *
   * @param url Request URL.
   * @return Observable of the body of type T.
   */
  public delete<T>(url: string) {
    return this.http.delete<T>(url).pipe(
      catchError(error => ErrorMappingHttpService.mapError(error))
    );
  }

}
