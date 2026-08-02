import { format, Locale } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { enGB } from 'date-fns/locale/en-GB';
import { fr } from 'date-fns/locale/fr';
import { it } from 'date-fns/locale/it';
import { nl } from 'date-fns/locale/nl';
import { parseLocalCalendarDate } from '../utility/local-calendar-date';
import { LanguageCode } from '../utility/types/language';

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

const DATE_FNS_LOCALES: Record<LanguageCode, Locale> = {
  en: enGB,
  de,
  fr,
  it,
  nl,
};

/**
 * Day/month pattern derived from a PrimeNG dateFormat (e.g. dd.mm.yy → dd.mm.).
 */
export function toPrimeNgDayMonthFormat(primeNgDateFormat: string): string {
  if (!primeNgDateFormat) {
    return 'dd.mm.';
  }
  if (primeNgDateFormat.startsWith('yy')) {
    return primeNgDateFormat.replace(/^yy([-./])/, '');
  }
  const trailingYear = primeNgDateFormat.match(/^(.*)([-./])yy$/);
  if (trailingYear) {
    const [, prefix, separator] = trailingYear;
    return separator === '.' ? `${prefix}.` : prefix;
  }
  return primeNgDateFormat.replace(/yy/g, '');
}

function dayMonthDateFnsFormat(language: LanguageCode): string {
  switch (language) {
    case 'de':
      return 'dd.MM.';
    case 'nl':
      return 'dd-MM';
    default:
      return 'dd/MM';
  }
}

export function formatClosureScheduleRange(
  alert: ClosureScheduleDateRange,
  language: LanguageCode = 'de',
): string | null {
  const locale = DATE_FNS_LOCALES[language] ?? de;

  if (alert.startDate && alert.endDate) {
    return `${format(parseLocalCalendarDate(alert.startDate), 'P', { locale })} – ${format(parseLocalCalendarDate(alert.endDate), 'P', { locale })}`;
  }

  if (
    alert.startMonth != null &&
    alert.startDay != null &&
    alert.endMonth != null &&
    alert.endDay != null
  ) {
    const pattern = dayMonthDateFnsFormat(language);
    return `${format(new Date(2000, alert.startMonth - 1, alert.startDay), pattern)} – ${format(new Date(2000, alert.endMonth - 1, alert.endDay), pattern)}`;
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
