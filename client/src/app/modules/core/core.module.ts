import {
  APP_INITIALIZER,
  ErrorHandler,
  LOCALE_ID,
  NgModule,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';

import { CoreRoutingModule } from './core-routing.module';
import { CoreComponent } from './core.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputTextModule } from 'primeng/inputtext';
import { MenuComponent } from './menu/menu.component';
import { MenubarModule } from 'primeng/menubar';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { LoginComponent } from './login/login.component';
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
import { FooterComponent } from './footer/footer.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { SharedModule } from '../shared/shared.module';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RefreshLoginModalComponent } from './refresh-login-modal/refresh-login-modal.component';
import { DialogModule } from 'primeng/dialog';
import { AppLevelAlertsComponent } from './app-level-alerts/app-level-alerts.component';
import { ForgotPasswordCheckMailboxComponent } from './forgot-password-check-mailbox/forgot-password-check-mailbox.component';
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
  MatomoInitializationMode,
  MatomoInitializerService,
  MatomoModule,
  MatomoRouterModule,
} from 'ngx-matomo-client';
import { Router } from '@angular/router';
import { selectGymMode } from '../../ngrx/selectors/instance-settings.selectors';

export function preloadTranslations(transloco: TranslocoService, store: Store) {
  return () => {
    store.select(selectGymMode).subscribe((gymMode) => {
      if (gymMode && !transloco.getActiveLang().endsWith("-gym")) {
        transloco.setActiveLang(environment.language + "-gym");
        transloco.setFallbackLangForMissingTranslation({ fallbackLang: environment.language });
      } else if (!gymMode && transloco.getActiveLang().endsWith("-gym")) {
        transloco.setActiveLang(environment.language);
      }
    });

    transloco.setActiveLang(environment.language);
    return forkJoin(["", "crag/", "sector/", "area/", "line/", "topoImage/", "linePath/", "maps/"].flatMap(path => [
      transloco.load(path + environment.language),
      transloco.load(path + environment.language + "-gym"),
    ]));
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
    MenuComponent,
    LoginComponent,
    FooterComponent,
    ChangePasswordComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    RefreshLoginModalComponent,
    AppLevelAlertsComponent,
    ForgotPasswordCheckMailboxComponent,
    NotFoundComponent,
  ],
  imports: [
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    CoreRoutingModule,
    InputTextModule,
    MenubarModule,
    HttpClientModule,
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
    MessagesModule,
    MessageModule,
    DialogModule,
    ToastModule,
    CragModule,
    BackgroundImageComponent,
    HeaderMenuComponent,
    HasPermissionDirective,
    AvatarModule,
    MatomoModule.forRoot({
      mode: MatomoInitializationMode.AUTO_DEFERRED,
    }),
    MatomoRouterModule,
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
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
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
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TranslocoService, Store],
      useFactory: preloadTranslations,
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [InstanceSettingsService, Store],
      useFactory: preloadInstanceSettings,
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [MenuItemsService],
      useFactory: preloadMenus,
    },
  ],
  bootstrap: [CoreComponent],
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
