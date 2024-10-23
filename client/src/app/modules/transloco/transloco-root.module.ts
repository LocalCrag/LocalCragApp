import { HttpClient } from '@angular/common/http';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
  TranslocoModule,
} from '@jsverse/transloco';
import { Injectable, NgModule } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Transloco HTTP loader.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  /**
   * Loads the translations file for the given language key.
   *
   * @param lang Language key.
   */
  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

/**
 * Transloco module. Specifies all necessary transloco settings.
 */
@NgModule({
  exports: [TranslocoModule],
  providers: [
    provideTransloco({
      config: {
        availableLangs: ['de'],
        defaultLang: environment.language,
        fallbackLang: 'de',
        prodMode: environment.production,
      },
      loader: TranslocoHttpLoader,
    }),
  ],
})
export class TranslocoRootModule {}
