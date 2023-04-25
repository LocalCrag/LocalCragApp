import {HttpClient} from '@angular/common/http';
import {
  Translation,
  TRANSLOCO_CONFIG,
  TRANSLOCO_LOADER,
  translocoConfig,
  TranslocoLoader,
  TranslocoModule
} from '@ngneat/transloco';
import {Injectable, NgModule} from '@angular/core';
import {environment} from '../environments/environment';

/**
 * Transloco HTTP loader.
 */
@Injectable({providedIn: 'root'})
export class TranslocoHttpLoader implements TranslocoLoader {

  constructor(private http: HttpClient) {
  }

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
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en', 'de'],
        defaultLang: 'de',
        fallbackLang: 'en',
        prodMode: environment.production,
      })
    },
    {provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader}
  ]
})
export class TranslocoRootModule {
}
