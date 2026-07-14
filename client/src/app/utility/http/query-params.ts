import { HttpParams } from '@angular/common/http';

export type ApiQueryParamValue = string | number | boolean;
export type ApiQueryParams = Record<
  string,
  ApiQueryParamValue | null | undefined
>;

/** Converts a plain query-param dict into Angular {@link HttpParams}. */
export function toHttpParams(params?: ApiQueryParams): HttpParams | undefined {
  if (!params) {
    return undefined;
  }
  let httpParams = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      httpParams = httpParams.set(key, String(value));
    }
  }
  return httpParams.keys().length > 0 ? httpParams : undefined;
}

/** HttpClient GET options for optional query params. */
export function httpGetOptions(params?: ApiQueryParams): {
  params?: HttpParams;
} {
  const httpParams = toHttpParams(params);
  return httpParams ? { params: httpParams } : {};
}
