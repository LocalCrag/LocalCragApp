import {
  EnvironmentProviders,
  inject,
  Provider,
  provideAppInitializer,
} from '@angular/core';
import {
  BrnCalendarI18n,
  injectBrnCalendarI18n,
  provideBrnCalendarI18n,
} from '@spartan-ng/brain/calendar';
import { LanguageCode } from '../../utility/types/language';
import { LanguageService } from './language.service';

const LOCALES: Record<LanguageCode, string> = {
  de: 'de-DE',
  en: 'en-GB',
  fr: 'fr-FR',
  it: 'it-IT',
  nl: 'nl-NL',
};

const MONTH_NAVIGATION: Record<
  LanguageCode,
  { previous: string; next: string }
> = {
  de: { previous: 'Vorheriger Monat', next: 'Nächster Monat' },
  en: { previous: 'Previous month', next: 'Next month' },
  fr: { previous: 'Mois précédent', next: 'Mois suivant' },
  it: { previous: 'Mese precedente', next: 'Mese successivo' },
  nl: { previous: 'Vorige maand', next: 'Volgende maand' },
};

type MonthLabels = ReturnType<BrnCalendarI18n['months']>;

/**
 * Calendar labels for an app language. English follows en-GB, so every
 * supported language starts the week on Monday, matching the old PrimeNG locales.
 */
export function calendarI18nFor(
  language: string | null | undefined,
): Partial<BrnCalendarI18n> {
  const code = ((language ?? 'en').replace(/-gym$/, '') ||
    'en') as LanguageCode;
  const locale = LOCALES[code] ?? LOCALES.en;
  const navigation = MONTH_NAVIGATION[code] ?? MONTH_NAVIGATION.en;
  const weekday = (index: number) => new Date(2024, 0, 7 + index);

  return {
    formatWeekdayName: (index) =>
      weekday(index).toLocaleDateString(locale, { weekday: 'short' }),
    labelWeekday: (index) =>
      weekday(index).toLocaleDateString(locale, { weekday: 'long' }),
    formatHeader: (month, year) =>
      new Date(year, month).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      }),
    formatMonth: (month) =>
      new Date(2000, month).toLocaleDateString(locale, { month: 'short' }),
    formatYear: (year) =>
      new Date(year, 0).toLocaleDateString(locale, { year: 'numeric' }),
    months: () =>
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((month) =>
        new Date(2000, month).toLocaleDateString(locale, { month: 'short' }),
      ) as MonthLabels,
    labelPrevious: () => navigation.previous,
    labelNext: () => navigation.next,
    firstDayOfWeek: () => 1,
  };
}

/**
 * One calendar i18n service for the app, kept in step with the active language.
 */
export function provideCalendarI18n(): Array<Provider | EnvironmentProviders> {
  return [
    provideBrnCalendarI18n(),
    provideAppInitializer(() => {
      const language = inject(LanguageService);
      const i18n = injectBrnCalendarI18n();
      language.renderedLanguage$.subscribe((rendered) => {
        i18n.use(
          calendarI18nFor(rendered ?? language.calculatedLanguage ?? 'en'),
        );
      });
    }),
  ];
}
