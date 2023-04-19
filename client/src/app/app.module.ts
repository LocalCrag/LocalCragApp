import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {InputTextModule} from 'primeng/inputtext';
import {MenuComponent} from './core/menu/menu.component';
import {MenubarModule} from 'primeng/menubar';
import {HttpClientModule} from '@angular/common/http';
import {ButtonModule} from 'primeng/button';
import { LoginComponent } from './core/login/login.component';
import {PasswordModule} from 'primeng/password';

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
    PasswordModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
