import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './core/login/login.component';
import {IsLoggedOutGuard} from './guards/is-logged-out.guard';
import {NewsComponent} from './core/news/news.component';
import {ImprintComponent} from './core/imprint/imprint.component';
import {DataPrivacyStatementComponent} from './core/data-privacy-statement/data-privacy-statement.component';
import {IsLoggedInGuard} from './guards/is-logged-in.guard';
import {ChangePasswordComponent} from './core/change-password/change-password.component';

const routes: Routes = [
  {
    path:'',
    component: NewsComponent
  },
  {
    path:'imprint',
    component: ImprintComponent
  },
  {
    path:'data-privacy-statement',
    component: DataPrivacyStatementComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [IsLoggedOutGuard],
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [IsLoggedInGuard],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
