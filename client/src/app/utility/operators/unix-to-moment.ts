import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import * as moment from 'moment';

/**
 * Maps a unix timestamp to a moment date. If the unix timestamp is invalid, it is mapped to null instead.
 */
export const unixToMoment = (msStream: Observable<number>): Observable<moment.Moment> => msStream.pipe(map(ms => {
  if (ms !== null && ms > 0) {
    return moment.unix(ms);
  }
  return null as any;
}
));
