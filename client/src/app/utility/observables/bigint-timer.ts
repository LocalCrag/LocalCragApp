import { concat, Observable, timer } from 'rxjs';
import { take, takeLast } from 'rxjs/operators';

/**
 * A timer observable that works with arbitrarily large numbers.
 * This is a workaround for this rxjs issue: https://github.com/ReactiveX/rxjs/issues/3015
 *
 * @param  ms Number of milliseconds to wait before observable emits.
 * @return An Observable that emits a `0` after the
 * `initialDelay` and ever-increasing numbers after each `period` of time
 * thereafter.
 */
export const bigIntTimer = (ms: number): Observable<number> => {
  if (ms < 0) {
    ms = 0;
  }
  const MAX = 2147483647;
  const n = Math.floor(ms / MAX);
  const r = ms % MAX;
  return concat(timer(MAX, MAX).pipe(take(n)), timer(r)).pipe(takeLast(1));
};
