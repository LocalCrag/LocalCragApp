import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {InputTextModule} from 'primeng/inputtext';
import {MenuComponent} from './core/menu/menu.component';
import {MenubarModule} from 'primeng/menubar';
import {ActionsModule} from './actions/actions.module';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    InputTextModule,
    MenubarModule,
    ActionsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
