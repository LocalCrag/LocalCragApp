import { Pipe, PipeTransform, inject } from '@angular/core';
import { format, Locale } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { it } from 'date-fns/locale/it';
import { enGB } from 'date-fns/locale/en-GB';
import { LanguageService } from '../../../services/core/language.service';

/**
 * Formats a date with the given formatting string using date-fns and locale.
 */
@Pipe({
  name: 'date',
})
export class DatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  private static DATE_FNS_LOCALES: Record<string, Locale> = {
    en: enGB,
    de,
    it,
  };

  /**
   * Transforms the input value by formatting the Date with the given formatting string.
   *
   * @param value Date (or parsable string/number) to format.
   * @param  type Choice of formatting string. 'date' for date only, 'datetime' for date and time.
   * @return Formatted Date.
   */
  transform(
    value: Date | string | number | null | undefined,
    type: 'date' | 'datetime' = 'date',
  ): string {
    if (!value) return '';

    // Build formatting string depending on type.
    let formattingString = '';
    if (type === 'date') {
      formattingString = 'P';
    } else if (type === 'datetime') {
      formattingString = 'Pp';
    }

    // Determine which locale to use: explicit arg -> injected LOCALE_ID -> default
    const locale = this.languageService.calculatedLanguage;
    const localeObj = DatePipe.DATE_FNS_LOCALES[locale];

    // Ensure we pass a Date object to date-fns format
    const date = value instanceof Date ? value : new Date(value as any);

    return format(date, formattingString, { locale: localeObj });
  }
}
