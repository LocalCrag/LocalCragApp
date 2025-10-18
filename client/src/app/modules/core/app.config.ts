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
  TranslocoService,
} from '@jsverse/transloco';
import { provideStore, Store } from '@ngrx/store';
import { InstanceSettingsService } from '../../services/crud/instance-settings.service';
import { MenuItemsService } from '../../services/crud/menu-items.service';
import { selectGymMode } from '../../ngrx/selectors/instance-settings.selectors';
import { forkJoin } from 'rxjs';
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

const preloadTranslations = (transloco: TranslocoService, store: Store) => {
  return () => {
    store.select(selectGymMode).subscribe((gymMode) => {
      if (gymMode && !transloco.getActiveLang().endsWith('-gym')) {
        transloco.setActiveLang(environment.language + '-gym');
        transloco.setFallbackLangForMissingTranslation({
          fallbackLang: environment.language,
        });
      } else if (!gymMode && transloco.getActiveLang().endsWith('-gym')) {
        transloco.setActiveLang(environment.language);
      }
    });

    return forkJoin(
      [
        '',
        'crag/',
        'sector/',
        'area/',
        'line/',
        'topoImage/',
        'linePath/',
        'maps/',
      ].flatMap((path) => [
        transloco.load(path + environment.language),
        transloco.load(path + environment.language + '-gym'),
      ]),
    );
  };
};

const preloadMenus = (menuItemsService: MenuItemsService) => {
  return () => {
    return menuItemsService.getMenuItems();
  };
};

const preloadInstanceSettings = (
  instanceSettingsService: InstanceSettingsService,
  store: Store,
) => {
  return () => {
    return instanceSettingsService.getInstanceSettings().pipe(
      map((instanceSettings) => {
        store.dispatch(updateInstanceSettings({ settings: instanceSettings }));
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
      useValue: environment.language,
    },
    provideHttpClient(withInterceptorsFromDi()),
    providePrimeNG({
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
    provideAppInitializer(() => {
      const initializerFn = preloadTranslations(
        inject(TranslocoService),
        inject(Store),
      );
      return initializerFn();
    }),
    provideAppInitializer(() => {
      const initializerFn = preloadInstanceSettings(
        inject(InstanceSettingsService),
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
    provideTransloco({
      config: {
        availableLangs: ['de', 'de-gym'],
        defaultLang: environment.language,
        fallbackLang: 'de',
        prodMode: environment.production,
        reRenderOnLangChange: true,
        missingHandler: {
          useFallbackTranslation: true,
        },
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
