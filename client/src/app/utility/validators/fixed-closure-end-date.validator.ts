import { AbstractControl, ValidatorFn } from '@angular/forms';
import { ClosureScheduleType } from '../../models/closure-schedule';
import { formatLocalCalendarDate } from '../local-calendar-date';

/**
 * Ensures a fixed closure's end date is on or after its start date.
 * No-op for non-FIXED schedule rows (annual windows may cross year boundaries).
 */
export const fixedClosureEndDateValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: boolean } | null => {
    const group = control.parent;
    if (
      !group ||
      group.get('scheduleType')?.value !== ClosureScheduleType.FIXED
    ) {
      return null;
    }

    const start = group.get('startDate')?.value as Date | null | undefined;
    const end = control.value as Date | null | undefined;
    if (!start || !end) {
      return null;
    }

    if (formatLocalCalendarDate(end) < formatLocalCalendarDate(start)) {
      return { fixedEndBeforeStart: true };
    }

    return null;
  };
