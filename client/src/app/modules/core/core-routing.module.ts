import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
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
import {SectorListComponent} from '../sector/sector-list/sector-list.component';
import {CragInfoComponent} from '../crag/crag-info/crag-info.component';
import {SectorComponent} from '../sector/sector/sector.component';
import {SectorInfoComponent} from '../sector/sector-info/sector-info.component';
import {SectorFormComponent} from '../sector/sector-form/sector-form.component';
import {AreaComponent} from '../area/area/area.component';
import {AreaInfoComponent} from '../area/area-info/area-info.component';
import {AreaFormComponent} from '../area/area-form/area-form.component';
import {AreaListComponent} from '../area/area-list/area-list.component';
import {LineListComponent} from '../line/line-list/line-list.component';
import {LineFormComponent} from '../line/line-form/line-form.component';
import {LineInfoComponent} from '../line/line-info/line-info.component';
import {LineComponent} from '../line/line/line.component';

const routes: Routes = [
  {
    path: '',
    component: NewsComponent
  },
  {
    path: 'imprint',
    component: ImprintComponent
  },
  {
    path: 'data-privacy-statement',
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
    path: 'topo',
    component: CragListComponent,
  },
  {
    path: 'topo/create-crag',
    component: CragFormComponent,
    canActivate: [IsLoggedInGuard],
  },
  {
    path: 'topo/:crag-slug',
    component: CragComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        children: [
          {
            path: '',
            component: CragInfoComponent,
            outlet: 'cragContent'
          }
        ]
      },
      {
        path: 'sectors',
        children: [
          {
            path: '',
            component: SectorListComponent,
            outlet: 'cragContent'
          }
        ]
      },
      {
        path: 'gallery',
        redirectTo: ''
      },
      {
        path: 'ascents',
        redirectTo: ''
      },
    ]
  },
  {
    path: 'topo/:crag-slug/edit',
    component: CragFormComponent,
    canActivate: [IsLoggedInGuard]
  },
  {
    path: 'topo/:crag-slug/create-sector',
    component: SectorFormComponent,
    canActivate: [IsLoggedInGuard],
  },
  {
    path: 'topo/:crag-slug/:sector-slug',
    component: SectorComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        children: [
          {
            path: '',
            component: SectorInfoComponent,
            outlet: 'sectorContent'
          }
        ]
      },
      {
        path: 'areas',
        children: [
          {
            path: '',
            component: AreaListComponent,
            outlet: 'sectorContent'
          }
        ]
      },
      {
        path: 'gallery',
        redirectTo: ''
      },
      {
        path: 'ascents',
        redirectTo: ''
      },
    ]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/edit',
    component: SectorFormComponent,
    canActivate: [IsLoggedInGuard]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/create-area',
    component: AreaFormComponent,
    canActivate: [IsLoggedInGuard],
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/create-line',
    component: LineFormComponent,
    canActivate: [IsLoggedInGuard],
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug',
    component: AreaComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        children: [
          {
            path: '',
            component: AreaInfoComponent,
            outlet: 'areaContent'
          }
        ]
      },
      {
        path: 'lines',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: LineListComponent,
            outlet: 'areaContent'
          }
        ]
      },
      {
        path: 'gallery',
        redirectTo: ''
      },
      {
        path: 'ascents',
        redirectTo: ''
      },
    ]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/edit',
    component: AreaFormComponent,
    canActivate: [IsLoggedInGuard]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/:line-slug',
    component: LineComponent,
    children: [
      {
        path: '',
        component: LineInfoComponent,
        outlet: 'lineContent'
      }
    ]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/:line-slug/edit',
    component: LineFormComponent,
    canActivate: [IsLoggedInGuard]
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
export class CoreRoutingModule {
}
