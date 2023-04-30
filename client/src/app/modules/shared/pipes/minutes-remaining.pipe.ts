import {ChangeDetectorRef, OnDestroy, Pipe, PipeTransform} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {Observable, timer} from 'rxjs';
import {map, startWith, takeWhile} from 'rxjs/operators';
import * as moment from 'moment';

/**
 * Converts a date object to a string that's showing the amount of minutes between the current date and the passed date.
 */
@Pipe({
  name: 'minutesRemaining',
  pure: false
})
export class MinutesRemainingPipe implements PipeTransform, OnDestroy {

  private async: AsyncPipe;

  private isDestroyed = false;
  private value: moment.Moment;
  private timer: Observable<string>;

  constructor(ref: ChangeDetectorRef) {
    this.async = new AsyncPipe(ref);
  }

  /**
   * Transforms the given date to the wanted string.
   *
   * @param obj The moment object to convert.
   * @param args Optional arguments.
   * @returns Transformed string.
   */
  public transform(obj: any, ...args: any[]): any {
    if (obj === null) {
      return '';
    }

    if (!moment.isMoment(obj)) {
      throw new Error('MinutesRemainingPipe works only with moments');
    }

    this.value = obj;

    if (!this.timer) {
      this.timer = this.getObservable();
    }

    return this.async.transform(this.timer);
  }

  /**
   * Set's the destroyed state to true which will automatically stop the observable subscription.
   */
  public ngOnDestroy() {
    this.isDestroyed = true;
  }

  /**
   * Gets a timer observable that emits every full minute and one time immediately.
   *
   * @returns TimerObservable.
   */
  private getObservable() {
    const initialDelay = this.value.diff(moment()) % 60000;
    return timer(initialDelay, 60000).pipe(
      startWith(0),
      takeWhile(_ => !this.isDestroyed),
      map((_x, _i) => this.remaining())
    );
  }

  /**
   * Returns the formatted string.
   *
   * @returns Minutes remaining string.
   */
  private remaining(): string {
    const now = moment();
    const remaining = Math.ceil(this.value.diff(now) / 1000 / 60);
    if (remaining === 1) {
      return '1 Minute';
    } else {
      return `${remaining} Minuten`;
    }
  }
}
