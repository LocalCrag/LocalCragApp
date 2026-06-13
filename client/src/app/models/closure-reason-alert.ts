import { format } from 'date-fns';
import { parseLocalCalendarDate } from '../utility/local-calendar-date';

export interface ClosureScheduleDateRange {
  startDate?: string | null;
  endDate?: string | null;
  startMonth?: number | null;
  startDay?: number | null;
  endMonth?: number | null;
  endDay?: number | null;
}

export class ClosureReasonAlert implements ClosureScheduleDateRange {
  reason: string | null = null;
  startsOn: string | null = null;
  startDate: string | null = null;
  endDate: string | null = null;
  startMonth: number | null = null;
  startDay: number | null = null;
  endMonth: number | null = null;
  endDay: number | null = null;

  static deserialize(payload: any): ClosureReasonAlert {
    if (typeof payload === 'string') {
      const alert = new ClosureReasonAlert();
      alert.reason = payload;
      return alert;
    }

    const alert = new ClosureReasonAlert();
    alert.reason = payload.reason ?? null;
    alert.startsOn = payload.startsOn ?? null;
    alert.startDate = payload.startDate ?? null;
    alert.endDate = payload.endDate ?? null;
    alert.startMonth = payload.startMonth ?? null;
    alert.startDay = payload.startDay ?? null;
    alert.endMonth = payload.endMonth ?? null;
    alert.endDay = payload.endDay ?? null;
    return alert;
  }
}

function formatIsoDateLabel(value: string): string {
  return format(parseLocalCalendarDate(value), 'dd.MM.yy');
}

function formatAnnualDayMonth(month: number, day: number): string {
  return format(new Date(2000, month - 1, day), 'dd.MM.');
}

export function formatClosureScheduleRange(
  alert: ClosureScheduleDateRange,
): string | null {
  if (alert.startDate && alert.endDate) {
    return `${formatIsoDateLabel(alert.startDate)} – ${formatIsoDateLabel(alert.endDate)}`;
  }

  if (
    alert.startMonth != null &&
    alert.startDay != null &&
    alert.endMonth != null &&
    alert.endDay != null
  ) {
    return `${formatAnnualDayMonth(alert.startMonth, alert.startDay)} – ${formatAnnualDayMonth(alert.endMonth, alert.endDay)}`;
  }

  return null;
}

export function deserializeClosureReasonAlerts(
  payload: any,
): ClosureReasonAlert[] {
  if (!payload?.length) {
    return [];
  }
  return payload.map(ClosureReasonAlert.deserialize);
}
