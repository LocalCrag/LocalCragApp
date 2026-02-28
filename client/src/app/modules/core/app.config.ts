import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  Injectable,
  LOCALE_ID,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ErrorHandlerInterceptor } from '../../utility/http-interceptors/error.interceptor';
import { RefreshTokenInterceptor } from '../../utility/http-interceptors/refresh-token.interceptor';
import { JWTInterceptor } from '../../utility/http-interceptors/jwt.interceptor';
import { ContentTypeInterceptor } from '../../utility/http-interceptors/content-type.interceptor';
import { environment } from '../../../environments/environment';
import * as Sentry from '@sentry/angular';
import { providePrimeNG } from 'primeng/config';
import { LocalCragTheme } from './theme/theme';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
} from '@jsverse/transloco';
import { provideStore, Store } from '@ngrx/store';
import { InstanceSettingsService } from '../../services/crud/instance-settings.service';
import { MenuItemsService } from '../../services/crud/menu-items.service';
import { concatMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { updateInstanceSettings } from '../../ngrx/actions/instance-settings.actions';
import { MessageService } from 'primeng/api';
import { metaReducers, reducers } from '../../ngrx/reducers';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { Actions, ofType, provideEffects } from '@ngrx/effects';
import { AuthEffects } from 'src/app/ngrx/effects/auth.effects';
import { DeviceEffects } from 'src/app/ngrx/effects/device.effects';
import { AppLevelAlertsEffects } from 'src/app/ngrx/effects/app-level-alerts.effects';
import { NotificationsEffects } from '../../ngrx/effects/notifications.effects';
import { MatomoInitializerService, provideMatomo } from 'ngx-matomo-client';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { LanguageService } from '../../services/core/language.service';
import { de } from 'primelocale/js/de.js';

/**
 * Transloco HTTP loader.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  /**
   * Loads the translations file for the given language key.
   *
   * @param lang Language key.
   */
  getTranslation(lang: string) {
    return this.http.get<Translation>(
      `/assets/i18n/${lang}.json?v=${environment.version}`,
    );
  }
}

/**
 * Initializes instance settings and language on app startup.
 * @param instanceSettingsService
 * @param languageService
 * @param store
 */
const initInstanceSettingsAndLanguage = (
  instanceSettingsService: InstanceSettingsService,
  languageService: LanguageService,
  store: Store,
) => {
  return () => {
    return instanceSettingsService.getInstanceSettings().pipe(
      map((instanceSettings) => {
        store.dispatch(updateInstanceSettings({ settings: instanceSettings }));
        return instanceSettings.language;
      }),
      concatMap(languageService.initApp.bind(languageService)),
    );
  };
};

const preloadMenus = (menuItemsService: MenuItemsService) => {
  return () => {
    return menuItemsService.getMenuItems();
  };
};

const initMatomo = (
  actions: Actions,
  matomoInitializer: MatomoInitializerService,
) => {
  return () => {
    actions.pipe(ofType(updateInstanceSettings)).subscribe((action) => {
      if (action.settings.matomoTrackerUrl && action.settings.matomoSiteId) {
        matomoInitializer.initializeTracker({
          trackerUrl: action.settings.matomoTrackerUrl,
          siteId: action.settings.matomoSiteId,
        });
      }
    });
  };
};

export function localeFactory(): string {
  return (
    localStorage.getItem('preferredLanguage') || navigator.language || 'de'
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
      return Promise.resolve();
    }),
    provideRouter(appRoutes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlerInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RefreshTokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JWTInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ContentTypeInterceptor,
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useFactory: localeFactory,
    },
    provideHttpClient(withInterceptorsFromDi()),
    providePrimeNG({
      translation: de,
      ripple: true,
      theme: {
        preset: LocalCragTheme,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    MessageService,
    provideAnimationsAsync(),
    provideTransloco({
      config: {
        availableLangs: ['de', 'de-gym', 'en', 'en-gym', 'it', 'it-gym'],
        defaultLang: 'de',
        fallbackLang: 'en',
        prodMode: environment.production,
        reRenderOnLangChange: true,
        missingHandler: {
          useFallbackTranslation: true,
        },
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(() => {
      const initializerFn = initInstanceSettingsAndLanguage(
        inject(InstanceSettingsService),
        inject(LanguageService),
        inject(Store),
      );
      return initializerFn();
    }),
    provideAppInitializer(() => {
      const initializerFn = preloadMenus(inject(MenuItemsService));
      return initializerFn();
    }),
    provideAppInitializer(() => {
      return initMatomo(inject(Actions), inject(MatomoInitializerService))();
    }),
    provideStore(reducers, { metaReducers }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true,
    }),
    provideEffects([
      AuthEffects,
      DeviceEffects,
      AppLevelAlertsEffects,
      NotificationsEffects,
    ]),
    provideMatomo({
      mode: 'deferred',
    }),
    provideTranslocoMessageformat(),
  ],
};
