import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {IsLoggedOutGuard} from '../../guards/is-logged-out.guard';
import {NewsComponent} from './news/news.component';
import {ImprintComponent} from './imprint/imprint.component';
import {DataPrivacyStatementComponent} from './data-privacy-statement/data-privacy-statement.component';
import {IsLoggedInGuard} from '../../guards/is-logged-in.guard';
import {ChangePasswordComponent} from './change-password/change-password.component';
import {ForgotPasswordComponent} from './forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './reset-password/reset-password.component';
import {
  ForgotPasswordCheckMailboxComponent
} from './forgot-password-check-mailbox/forgot-password-check-mailbox.component';
import {CragFormComponent} from '../crag/crag-form/crag-form.component';
import {CragListComponent} from '../crag/crag-list/crag-list.component';
import {CragComponent} from '../crag/crag/crag.component';
import {NotFoundComponent} from './not-found/not-found.component';

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
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [IsLoggedOutGuard],
  },
  {
    path: 'forgot-password-check-mailbox',
    component: ForgotPasswordCheckMailboxComponent,
    canActivate: [IsLoggedOutGuard],
  },
  {
    path: 'reset-password/:hash',
    component: ResetPasswordComponent,
    canActivate: [IsLoggedOutGuard],
  },
  {
    path: 'crags',
    component: CragListComponent,
  },
  {
    path: 'create-crag',
    component: CragFormComponent,
    canActivate: [IsLoggedInGuard],
  },
  {
    path: 'crags/:crag-slug',
    children: [
      {
        path: '',
        component: CragComponent
      },
      {
        path: 'edit',
        component: CragFormComponent,
        canActivate: [IsLoggedInGuard]
      }
    ]
  },
  {
    component: NotFoundComponent,
    path: '**'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class CoreRoutingModule { }
