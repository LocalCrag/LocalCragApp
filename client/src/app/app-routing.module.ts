import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './core/login/login.component';
import {IsLoggedOutGuard} from './guards/is-logged-out.guard';
import {LandingComponent} from './core/landing/landing.component';

const routes: Routes = [
  {
    path:'',
    component: LandingComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [IsLoggedOutGuard],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
