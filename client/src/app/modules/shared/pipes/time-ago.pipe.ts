import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'timeAgo',
  pure: true,
})
export class TimeAgoPipe implements PipeTransform {
  private transloco = inject(TranslocoService);

  transform(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else {
      // try parse string
      date = new Date(String(value));
    }

    if (isNaN(date.getTime())) {
      return '';
    }

    const now = Date.now();
    const diffMs = now - date.getTime();

    // If the date is in the future, treat small future diffs as 'now'
    if (diffMs < 0) {
      const abs = Math.abs(diffMs);
      const secondsFuture = Math.floor(abs / 1000);
      if (secondsFuture < 60) return this.transloco.translate('time.now');
      return this.transloco.translate('time.now');
    }

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) {
      return this.transloco.translate('time.now');
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return this.transloco.translate('time.minute', { count: minutes });
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return this.transloco.translate('time.hour', { count: hours });
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      return this.transloco.translate('time.day', { count: days });
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return this.transloco.translate('time.month', { count: months });
    }

    const years = Math.floor(days / 365);
    return this.transloco.translate('time.year', { count: years });
  }
}
