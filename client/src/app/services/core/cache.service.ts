import {Injectable} from '@angular/core';
import {delay, Observable, OperatorFunction, share, shareReplay, timestamp} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

/**
 * Returns an observable that caches an initial request for the given windowTime. After the windowTime is passed,
 * the request is repeated. During the windowTime, only replays are shared.
 * @param makeRequest Request to make.
 * @param windowTime Time before making a second, third, ... request.
 */
export const createCachedSource = (makeRequest: () => Observable<any>, windowTime: number) => {
  let cache: any;
  return new Observable((obs) => {
    const isFresh = cache?.timestamp + windowTime > new Date().getTime();
    if (isFresh) {
      obs.next(cache.value);
      obs.complete();
      return null;
    } else {
      return makeRequest()
        .pipe(
          timestamp(),
          tap((current) => (cache = current)),
          map(({value}) => value)
        )
        .subscribe(obs);
    }
  }).pipe(share());
};

/**
 * A service that caches http requests for LabNodes CRUD services.
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {

  private cachingTime = 24 * 60 * 60 * 1000;
  private objects: Map<string, Observable<any>> = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {
  }

  /**
   * Fetch a resource, either from cache or from backend.
   * @param path Path to fetch the resource from.
   * @param operator Any kind of mapping function to apply after initial fetching from backend. Most probably should be
   * a mapping function to parse the JSON response in a model.
   * @return An observable of the resource of type T that should get fetched. This resource will be fetched only once
   * during the span of this service's cachingTime. Any requests coming after the initial one for the same path, will
   * be returned a replay.
   */
  public get<T>(path: string, operator: OperatorFunction<any, T>): Observable<T> {
    if (!this.objects.has(path)) {
      this.objects.set(path, createCachedSource(() => this.http.get(path).pipe(operator), this.cachingTime));
    }
    return this.objects.get(path);
  }

  /**
   * Removes an item from the cache.
   * @param path Item to remove.
   */
  public clear(path: string) {
    this.objects.delete(path);
  }

}
