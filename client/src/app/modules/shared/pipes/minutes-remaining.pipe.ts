import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { map, startWith, takeWhile } from 'rxjs/operators';
import { differenceInMilliseconds } from 'date-fns';

/**
 * Converts a date object to a string that's showing the amount of minutes between the current date and the passed date.
 */
@Pipe({
  name: 'minutesRemaining',
  pure: false,
})
export class MinutesRemainingPipe implements PipeTransform, OnDestroy {
  private subscription: Subscription | null = null;
  private isDestroyed = false;
  private value: Date;
  private cachedResult: string;

  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Transforms the given date to the wanted string.
   *
   * @param obj The Date object to convert.
   * @returns Transformed string.
   */
  public transform(obj: Date): string {
    if (obj === null) {
      return '';
    }

    if (!(obj instanceof Date)) {
      throw new Error('MinutesRemainingPipe works only with Dates');
    }

    if (this.value !== obj) {
      this.value = obj;
      this.cachedResult = '';
      this.unsubscribe();

      const observable = this.getObservable();
      this.subscription = observable.subscribe((result) => {
        this.cachedResult = result;
        this.cdr.markForCheck();
      });
    }

    return this.cachedResult || '';
  }

  /**
   * Cleans up the subscription when the pipe is destroyed.
   */
  public ngOnDestroy() {
    this.isDestroyed = true;
    this.unsubscribe();
  }

  /**
   * Unsubscribes from the current subscription.
   */
  private unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Gets a timer observable that emits every full minute and one time immediately.
   *
   * @returns TimerObservable.
   */
  private getObservable(): Observable<string> {
    const initialDelay =
      differenceInMilliseconds(this.value, new Date()) % 60000;
    return timer(initialDelay, 60000).pipe(
      startWith(0),
      takeWhile(() => !this.isDestroyed),
      map(() => this.remaining()),
    );
  }

  /**
   * Returns the formatted string.
   *
   * @returns Minutes remaining string.
   */
  private remaining(): string {
    const remaining = Math.ceil(
      differenceInMilliseconds(this.value, new Date()) / 1000 / 60,
    );
    if (remaining === 1) {
      return '1 Minute';
    } else {
      return `${remaining} Minuten`;
    }
  }
}
