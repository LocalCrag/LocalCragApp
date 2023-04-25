import {LOCALE_ID, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {InputTextModule} from 'primeng/inputtext';
import {MenuComponent} from './core/menu/menu.component';
import {MenubarModule} from 'primeng/menubar';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {ButtonModule} from 'primeng/button';
import {LoginComponent} from './core/login/login.component';
import {PasswordModule} from 'primeng/password';
import {StoreModule} from '@ngrx/store';
import {metaReducers, reducers} from './ngrx/reducers';
import {environment} from '../environments/environment';
import {EffectsModule} from '@ngrx/effects';
import {AuthEffects} from './ngrx/effects/auth.effects';
import {AppLevelAlertsEffects} from './ngrx/effects/app-level-alerts.effects';
import {NotificationsEffects} from './ngrx/effects/notifications.effects';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {TranslocoRootModule} from './transloco-root.module';
import {ErrorHandlerInterceptor} from './utility/http-interceptors/error.interceptor';
import {RefreshTokenInterceptor} from './utility/http-interceptors/refresh-token.interceptor';
import {JWTInterceptor} from './utility/http-interceptors/jwt.interceptor';
import {ContentTypeInterceptor} from './utility/http-interceptors/content-type.interceptor';
import {ToastrModule} from 'ngx-toastr';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    LoginComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    InputTextModule,
    MenubarModule,
    HttpClientModule,
    ButtonModule,
    PasswordModule,
    StoreModule.forRoot(reducers, {
      metaReducers
    }),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production
    }),
    EffectsModule.forRoot([
      AuthEffects,
      AppLevelAlertsEffects,
      NotificationsEffects,
    ]),
    TranslocoRootModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      preventDuplicates: true,
      positionClass: 'toast-bottom-right',
      progressBar: true,
      progressAnimation: 'decreasing'
    }),
  ],
  providers: [
    {
      provide: LOCALE_ID,
      useValue: 'de'
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlerInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RefreshTokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JWTInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ContentTypeInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
