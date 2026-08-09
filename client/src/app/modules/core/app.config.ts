import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  Injectable,
  LOCALE_ID,
  provideAppInitializer,
} from '@angular/core';
import {
  provideRouter,
  Router,
  withNavigationErrorHandler,
} from '@angular/router';
import { appRoutes } from './app.routes';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ErrorHandlerInterceptor } from '../../utility/http-interceptors/error.interceptor';
import { LocalCragErrorHandler } from '../../services/core/local-crag-error-handler';
import { ErrorHandlerService } from '../../services/core/error-handler.service';
import { RefreshTokenInterceptor } from '../../utility/http-interceptors/refresh-token.interceptor';
import { JWTInterceptor } from '../../utility/http-interceptors/jwt.interceptor';
import { ContentTypeInterceptor } from '../../utility/http-interceptors/content-type.interceptor';
import { environment } from '../../../environments/environment';
import * as Sentry from '@sentry/angular';
import { providePrimeNG } from 'primeng/config';
import { LocalCragTheme } from './theme/theme';
import { ThemeService } from '../../services/core/theme.service';
import { HardwareBackButtonService } from '../../services/core/hardware-back-button.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
} from '@jsverse/transloco';
import { provideStore, Store } from '@ngrx/store';
import { InstanceSettingsService } from '../../services/crud/instance-settings.service';
import { MenuItemsService } from '../../services/crud/menu-items.service';
import { concatMap, from, of, timeout } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { hasCompletedInstanceOnboarding } from '../../services/core/instance-registry';
import { updateInstanceSettings } from '../../ngrx/actions/instance-settings.actions';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
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
import { InstanceSettings } from '../../models/instance-settings';
import {
  SENTRY_IGNORED_NETWORK_ERROR_PATTERNS,
  shouldDropSentryEvent,
} from '../../utility/sentry-network-error';

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
    return from(hasCompletedInstanceOnboarding()).pipe(
      switchMap((onboardingDone) => {
        // Native onboarding: skip the API round-trip until an instance is saved.
        // Otherwise a seeded emulator host (10.0.2.2) hangs CapacitorHttp on phones.
        if (Capacitor.isNativePlatform() && !onboardingDone) {
          return languageService.initApp(undefined);
        }
        return instanceSettingsService.getInstanceSettings().pipe(
          timeout({ first: 8000 }),
          map((instanceSettings) => {
            store.dispatch(
              updateInstanceSettings({ settings: instanceSettings }),
            );
            initSentryFromSettings(instanceSettings);
            return instanceSettings.language;
          }),
          concatMap(languageService.initApp.bind(languageService)),
          // A failed API call here (offline, unreachable backend) must not block app bootstrap
          // forever — the native shell still needs to render and hide its splash screen (D-07)
          // even with no connectivity, falling back to the browser/default language.
          catchError((err) => {
            console.error('Failed to load instance settings on startup', err);
            return languageService.initApp(undefined);
          }),
        );
      }),
    );
  };
};

const preloadMenus = (menuItemsService: MenuItemsService) => {
  return () => {
    return from(hasCompletedInstanceOnboarding()).pipe(
      switchMap((onboardingDone) => {
        if (Capacitor.isNativePlatform() && !onboardingDone) {
          return of(null);
        }
        return menuItemsService.getMenuItems().pipe(
          timeout({ first: 8000 }),
          catchError((err) => {
            console.error('Failed to preload menu items on startup', err);
            return of(null);
          }),
        );
      }),
    );
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

/**
 * Initializes Sentry from server env-driven settings (SENTRY_ENABLED / SENTRY_DSN).
 */
const initSentryFromSettings = (settings: InstanceSettings): void => {
  if (!settings.sentryEnabled || !settings.sentryDsn) {
    return;
  }
  // According to Sentry: DSNs are safe to keep public (public in client-side code anyway)
  Sentry.init({
    dsn: settings.sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    ignoreErrors: SENTRY_IGNORED_NETWORK_ERROR_PATTERNS,
    beforeSend(event, hint) {
      if (shouldDropSentryEvent(event, hint)) {
        return null;
      }
      return event;
    },
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', '127.0.0.1'],
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
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
      useClass: LocalCragErrorHandler,
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
      return Promise.resolve();
    }),
    provideAppInitializer(() => {
      inject(ThemeService).init();
      return Promise.resolve();
    }),
    provideAppInitializer(() => {
      inject(HardwareBackButtonService).register();
      return Promise.resolve();
    }),
    provideRouter(
      appRoutes,
      withNavigationErrorHandler((navigationError) => {
        inject(ErrorHandlerService).handleClientError(
          navigationError.error ?? navigationError,
        );
      }),
    ),
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
          darkModeSelector: '.lc-dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
    MessageService,
    // Root DialogService so RockExplorerLiveSessionGuard can open Finish/Discard/Cancel
    // from menu + picker even when local component DialogService trees are out of scope.
    DialogService,
    provideAnimationsAsync(),
    provideTransloco({
      config: {
        availableLangs: [
          'de',
          'de-gym',
          'en',
          'en-gym',
          'fr',
          'fr-gym',
          'it',
          'it-gym',
          'nl',
          'nl-gym',
        ],
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
