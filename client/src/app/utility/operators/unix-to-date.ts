import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * Maps a unix timestamp to a date. If the unix timestamp is invalid, it is mapped to null instead.
 */
export const unixToDate = (msStream: Observable<number>): Observable<Date> => msStream.pipe(map(ms => {
  if (ms !== null && ms > 0) {
    return new Date(ms * 1000);
  }
  return null as any;
}
));
