import { AbstractControl, ValidatorFn } from '@angular/forms';
import { ClosureScheduleType } from '../../models/closure-schedule';

const LEAP_YEAR = 2000; // leap year reference so Feb 29 is included in checks
const DAYS_IN_LEAP_YEAR = 366;

function dayOfYear(month: number, day: number, year: number): number {
  const start = new Date(year, 0, 0);
  const current = new Date(year, month - 1, day);
  return Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function closedDaysInAnnualWindow(
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): number {
  const startDoy = dayOfYear(startMonth, startDay, LEAP_YEAR);
  const endDoy = dayOfYear(endMonth, endDay, LEAP_YEAR);

  if (startDoy <= endDoy) {
    return endDoy - startDoy + 1;
  }
  return DAYS_IN_LEAP_YEAR - startDoy + 1 + endDoy;
}

/** True when the annual window leaves no open day in a calendar year. */
export function annualMonthDaysCoverEntireYear(
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  return (
    closedDaysInAnnualWindow(startMonth, startDay, endMonth, endDay) >=
    DAYS_IN_LEAP_YEAR
  );
}

/**
 * Validates annual closure date pickers on the end-date control.
 * Month/day only; picker year and field order are ignored.
 */
export const annualClosureEndDateValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: boolean } | null => {
    const group = control.parent;
    if (
      !group ||
      group.get('scheduleType')?.value !== ClosureScheduleType.ANNUAL
    ) {
      return null;
    }

    const startControl = group.get('startDate');
    const start = startControl?.value as Date | null | undefined;
    const end = control.value as Date | null | undefined;
    if (!start || !end) {
      if (startControl?.touched && control.touched) {
        return { annualDatesRequired: true };
      }
      return null;
    }

    if (
      annualMonthDaysCoverEntireYear(
        start.getMonth() + 1,
        start.getDate(),
        end.getMonth() + 1,
        end.getDate(),
      )
    ) {
      return { annualCoversEntireYear: true };
    }

    return null;
  };
