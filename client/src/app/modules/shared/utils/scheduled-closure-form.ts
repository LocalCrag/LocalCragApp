import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ClosureSchedule,
  ClosureScheduleType,
} from '../../../models/closure-schedule';
import {
  formatLocalCalendarDate,
  parseLocalCalendarDate,
} from '../../../utility/local-calendar-date';
import { annualClosureEndDateValidator } from '../../../utility/validators/annual-closure-end-date.validator';
import { fixedClosureEndDateValidator } from '../../../utility/validators/fixed-closure-end-date.validator';

/** Display year for annual date pickers (only month/day are persisted). */
export function annualScheduleReferenceYear(): number {
  return new Date().getFullYear();
}

export const CLOSURE_SCHEDULE_TYPES: ClosureScheduleType[] = [
  ClosureScheduleType.ANNUAL,
  ClosureScheduleType.FIXED,
  ClosureScheduleType.PERMANENT,
];

export function monthDayToDate(
  month: number | null | undefined,
  day: number | null | undefined,
): Date | null {
  if (month == null || day == null) {
    return null;
  }
  return new Date(annualScheduleReferenceYear(), month - 1, day);
}

/** Strip picker year; annual schedules persist month/day only. */
export function normalizeAnnualPickerDate(
  date: Date | null | undefined,
): Date | null {
  if (!date) {
    return null;
  }
  return new Date(
    annualScheduleReferenceYear(),
    date.getMonth(),
    date.getDate(),
  );
}

/** Apply the current calendar year to month/day values (e.g. when switching to FIXED). */
export function applyCurrentYearToMonthDay(
  date: Date | null | undefined,
): Date | null {
  return normalizeAnnualPickerDate(date);
}

export function dateToMonthDay(date: Date | null | undefined): {
  month: number | null;
  day: number | null;
} {
  if (!date) {
    return { month: null, day: null };
  }
  return { month: date.getMonth() + 1, day: date.getDate() };
}

function scheduleToFormDates(schedule?: Partial<ClosureSchedule>): {
  startDate: Date | null;
  endDate: Date | null;
} {
  if (schedule?.scheduleType === ClosureScheduleType.FIXED) {
    return {
      startDate: schedule.startDate
        ? parseLocalCalendarDate(schedule.startDate)
        : null,
      endDate: schedule.endDate
        ? parseLocalCalendarDate(schedule.endDate)
        : null,
    };
  }

  if (
    schedule?.scheduleType === ClosureScheduleType.ANNUAL ||
    schedule?.scheduleType == null
  ) {
    return {
      startDate: monthDayToDate(schedule?.startMonth, schedule?.startDay),
      endDate: monthDayToDate(schedule?.endMonth, schedule?.endDay),
    };
  }

  return { startDate: null, endDate: null };
}

export function buildClosureScheduleDialogForm(
  fb: FormBuilder,
  schedule?: Partial<ClosureSchedule>,
): FormGroup {
  const dates = scheduleToFormDates(schedule);
  const group = fb.group({
    scheduleType: [
      schedule?.scheduleType ?? ClosureScheduleType.ANNUAL,
      [Validators.required],
    ],
    reason: [schedule?.reason ?? null],
    startDate: [dates.startDate],
    endDate: [
      dates.endDate,
      [fixedClosureEndDateValidator(), annualClosureEndDateValidator()],
    ],
  });

  return group;
}

export function patchClosureScheduleDialogForm(
  form: FormGroup,
  schedule: ClosureSchedule,
): void {
  const dates = scheduleToFormDates(schedule);
  form.patchValue({
    scheduleType: schedule.scheduleType,
    reason: schedule.reason,
    startDate: dates.startDate,
    endDate: dates.endDate,
  });
}

export function readClosureScheduleFromDialogForm(
  form: FormGroup,
  schedule: ClosureSchedule,
): void {
  const value = form.getRawValue();
  schedule.scheduleType = value.scheduleType;
  schedule.reason = value.reason ?? null;
  schedule.startMonth = null;
  schedule.startDay = null;
  schedule.endMonth = null;
  schedule.endDay = null;
  schedule.startDate = null;
  schedule.endDate = null;

  if (value.scheduleType === ClosureScheduleType.ANNUAL) {
    const start = dateToMonthDay(value.startDate);
    const end = dateToMonthDay(value.endDate);
    schedule.startMonth = start.month;
    schedule.startDay = start.day;
    schedule.endMonth = end.month;
    schedule.endDay = end.day;
  }

  if (value.scheduleType === ClosureScheduleType.FIXED) {
    schedule.startDate = value.startDate
      ? formatLocalCalendarDate(value.startDate)
      : null;
    schedule.endDate = value.endDate
      ? formatLocalCalendarDate(value.endDate)
      : null;
  }
}

function padDayMonth(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatIsoDateLabel(value: string): string {
  const date = parseLocalCalendarDate(value);
  return `${padDayMonth(date.getDate())}.${padDayMonth(date.getMonth() + 1)}.${date.getFullYear().toString().slice(-2)}`;
}

export function formatScheduleSummary(schedule: ClosureSchedule): string {
  const parts: string[] = [];

  if (schedule.scheduleType === ClosureScheduleType.ANNUAL) {
    if (
      schedule.startMonth != null &&
      schedule.startDay != null &&
      schedule.endMonth != null &&
      schedule.endDay != null
    ) {
      parts.push(
        `${padDayMonth(schedule.startDay)}.${padDayMonth(schedule.startMonth)}. – ${padDayMonth(schedule.endDay)}.${padDayMonth(schedule.endMonth)}.`,
      );
    }
  } else if (schedule.scheduleType === ClosureScheduleType.FIXED) {
    if (schedule.startDate && schedule.endDate) {
      parts.push(
        `${formatIsoDateLabel(schedule.startDate)} – ${formatIsoDateLabel(schedule.endDate)}`,
      );
    }
  }

  if (schedule.reason) {
    parts.push(schedule.reason);
  }

  return parts.join(' · ');
}
