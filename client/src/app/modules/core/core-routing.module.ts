import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {ImprintComponent} from './imprint/imprint.component';
import {DataPrivacyStatementComponent} from './data-privacy-statement/data-privacy-statement.component';
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
import {TopoImageListComponent} from '../topo-images/topo-image-list/topo-image-list.component';
import {TopoImageFormComponent} from '../topo-images/topo-image-form/topo-image-form.component';
import {LinePathFormComponent} from '../line-path-editor/line-path-form/line-path-form.component';
import {isLoggedOut} from '../../guards/is-logged-out';
import {isLoggedIn} from '../../guards/is-logged-in';
import {PostListComponent} from '../blog/post-list/post-list.component';
import {PostFormComponent} from '../blog/post-form/post-form.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'news'
  },
  {
    path: 'news',
    component: PostListComponent
  },
  {
    path: 'news/create-post',
    component: PostFormComponent,
    canActivate: [isLoggedIn],
  },
  {
    path: 'news/:post-slug/edit',
    component: PostFormComponent,
    canActivate: [isLoggedIn]
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
    canActivate: [isLoggedOut],
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [isLoggedIn],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [isLoggedOut],
  },
  {
    path: 'forgot-password-check-mailbox',
    component: ForgotPasswordCheckMailboxComponent,
    canActivate: [isLoggedOut],
  },
  {
    path: 'reset-password/:hash',
    component: ResetPasswordComponent,
    canActivate: [isLoggedOut],
  },
  {
    path: 'topo',
    component: CragListComponent,
  },
  {
    path: 'topo/create-crag',
    component: CragFormComponent,
    canActivate: [isLoggedIn],
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
    canActivate: [isLoggedIn]
  },
  {
    path: 'topo/:crag-slug/create-sector',
    component: SectorFormComponent,
    canActivate: [isLoggedIn],
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
    canActivate: [isLoggedIn]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/create-area',
    component: AreaFormComponent,
    canActivate: [isLoggedIn],
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/create-line',
    component: LineFormComponent,
    canActivate: [isLoggedIn],
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/add-topo-image',
    component: TopoImageFormComponent,
    canActivate: [isLoggedIn],
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
        path: 'topo-images',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: TopoImageListComponent,
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
    canActivate: [isLoggedIn]
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
    canActivate: [isLoggedIn]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/topo-images/:topo-image-id/add-line-path',
    component: LinePathFormComponent,
    canActivate: [isLoggedIn]
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
