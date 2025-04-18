import {
  ErrorHandler,
  LOCALE_ID,
  NgModule,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';

import { CoreRoutingModule } from './core-routing.module';
import { CoreComponent } from './core.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { Store, StoreModule } from '@ngrx/store';
import { metaReducers, reducers } from '../../ngrx/reducers';
import { environment } from '../../../environments/environment';
import { Actions, EffectsModule, ofType } from '@ngrx/effects';
import { AuthEffects } from '../../ngrx/effects/auth.effects';
import { AppLevelAlertsEffects } from '../../ngrx/effects/app-level-alerts.effects';
import { NotificationsEffects } from '../../ngrx/effects/notifications.effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TranslocoRootModule } from '../transloco/transloco-root.module';
import { ErrorHandlerInterceptor } from '../../utility/http-interceptors/error.interceptor';
import { RefreshTokenInterceptor } from '../../utility/http-interceptors/refresh-token.interceptor';
import { JWTInterceptor } from '../../utility/http-interceptors/jwt.interceptor';
import { ContentTypeInterceptor } from '../../utility/http-interceptors/content-type.interceptor';
import { ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';
import { SharedModule } from '../shared/shared.module';
import { MessageModule } from 'primeng/message';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RefreshLoginModalComponent } from './refresh-login-modal/refresh-login-modal.component';
import { DialogModule } from 'primeng/dialog';
import { AppLevelAlertsComponent } from './app-level-alerts/app-level-alerts.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CragModule } from '../crag/crag.module';
import { DeviceEffects } from '../../ngrx/effects/device.effects';
import { NotFoundComponent } from './not-found/not-found.component';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { BackgroundImageComponent } from './background-image/background-image.component';
import { MenuItemsService } from '../../services/crud/menu-items.service';
import { InstanceSettingsService } from '../../services/crud/instance-settings.service';
import { updateInstanceSettings } from '../../ngrx/actions/instance-settings.actions';
import { HeaderMenuComponent } from '../shared/components/header-menu/header-menu.component';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';
import { AvatarModule } from 'primeng/avatar';
import {
  MatomoInitializerService,
  MatomoModule,
  MatomoRouterModule,
} from 'ngx-matomo-client';
import { Router } from '@angular/router';
import { selectGymMode } from '../../ngrx/selectors/instance-settings.selectors';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { LocalCragTheme } from './theme/theme';
import { FooterComponent } from './footer/footer.component';
import { MenuComponent } from './menu/menu.component';

export function preloadTranslations(transloco: TranslocoService, store: Store) {
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
}

export function preloadMenus(menuItemsService: MenuItemsService) {
  return () => {
    return menuItemsService.getMenuItems();
  };
}

export function preloadInstanceSettings(
  instanceSettingsService: InstanceSettingsService,
  store: Store,
) {
  return () => {
    return instanceSettingsService.getInstanceSettings().pipe(
      map((instanceSettings) => {
        store.dispatch(updateInstanceSettings({ settings: instanceSettings }));
      }),
    );
  };
}

@NgModule({
  declarations: [
    CoreComponent,
    ResetPasswordComponent,
    RefreshLoginModalComponent,
    AppLevelAlertsComponent,
    NotFoundComponent,
  ],
  bootstrap: [CoreComponent],
  imports: [
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    CoreRoutingModule,
    InputTextModule,
    MenubarModule,
    ButtonModule,
    PasswordModule,
    StoreModule.forRoot(reducers, {
      metaReducers,
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
      connectInZone: true,
    }),
    EffectsModule.forRoot([
      AuthEffects,
      DeviceEffects,
      AppLevelAlertsEffects,
      NotificationsEffects,
    ]),
    TranslocoRootModule,
    ReactiveFormsModule,
    CardModule,
    MenuModule,
    MessageModule,
    DialogModule,
    ToastModule,
    CragModule,
    BackgroundImageComponent,
    HeaderMenuComponent,
    HasPermissionDirective,
    AvatarModule,
    MatomoModule.forRoot({
      mode: 'deferred',
    }),
    MatomoRouterModule,
    FooterComponent,
    MenuComponent,
  ],
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
    {
      provide: LOCALE_ID,
      useValue: environment.language,
    },
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
    MessageService,
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
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: LocalCragTheme,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
})
export class CoreModule {
  constructor(
    private actions: Actions,
    private matomoInitializer: MatomoInitializerService,
  ) {
    this.actions.pipe(ofType(updateInstanceSettings)).subscribe((action) => {
      if (action.settings.matomoTrackerUrl && action.settings.matomoSiteId) {
        this.matomoInitializer.initializeTracker({
          trackerUrl: action.settings.matomoTrackerUrl,
          siteId: action.settings.matomoSiteId,
        });
      }
    });
  }
}
