import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginComponent} from './login/login.component';
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
import {StaticBackgroundImages} from './background-image/background-image.component';
import {RegionComponent} from '../region/region/region.component';
import {RegionInfoComponent} from '../region/region-info/region-info.component';
import {RegionFormComponent} from '../region/region-form/region-form.component';
import {CragRulesComponent} from '../crag/crag-rules/crag-rules.component';
import {SectorRulesComponent} from '../sector/sector-rules/sector-rules.component';
import {RegionRulesComponent} from '../region/region-rules/region-rules.component';
import {MenuPagesListComponent} from '../menu-pages/menu-pages-list/menu-pages-list.component';
import {MenuPagesFormComponent} from '../menu-pages/menu-pages-form/menu-pages-form.component';
import {MenuItemsListComponent} from '../menu-pages/menu-items-list/menu-items-list.component';
import {MenuItemsFormComponent} from '../menu-pages/menu-items-form/menu-items-form.component';
import {MenuPageDetailComponent} from '../menu-pages/menu-page-detail/menu-page-detail.component';
import {InstanceSettingsFormComponent} from './instance-settings-form/instance-settings-form.component';
import {RegisterComponent} from './register/register.component';
import {RegisterCheckMailboxComponent} from './register-check-mailbox/register-check-mailbox.component';
import {ActivateAccountComponent} from './activate-account/activate-account.component';
import {AccountFormComponent} from './account-form/account-form.component';
import {ChangeEmailComponent} from './change-email/change-email.component';
import {UserListComponent} from '../user/user-list/user-list.component';
import {isModerator} from '../../guards/is-moderator';
import {isAdmin} from '../../guards/is-admin';
import {AscentListComponent} from '../ascent/ascent-list/ascent-list.component';
import {AscentsComponent} from '../ascent/ascents/ascents.component';
import {UserDetailComponent} from '../user/user-detail/user-detail.component';
import {UserAscentsComponent} from '../user/user-ascents/user-ascents.component';
import {CragAscentsComponent} from '../crag/crag-ascents/crag-ascents.component';
import {SectorAscentsComponent} from '../sector/sector-ascents/sector-ascents.component';
import {AreaAscentsComponent} from '../area/area-ascents/area-ascents.component';
import {LineAscentsComponent} from '../line/line-ascents/line-ascents.component';
import {RegionAscentsComponent} from '../region/region-ascents/region-ascents.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'news'
  },
  {
    path: 'news',
    component: PostListComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'news/create-post',
    component: PostFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'news/:post-slug/edit',
    component: PostFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'pages',
    component: MenuPagesListComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'pages/create-menu-page',
    component: MenuPagesFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'pages/:menu-page-slug',
    component: MenuPageDetailComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'pages/:menu-page-slug/edit',
    component: MenuPagesFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'menu-items',
    component: MenuItemsListComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'menu-items/create-menu-item/:position',
    component: MenuItemsFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'menu-items/:menu-item-id/edit',
    component: MenuItemsFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [isLoggedOut],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [isLoggedIn],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [isLoggedOut],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'register-check-mailbox',
    component: RegisterCheckMailboxComponent,
    canActivate: [isLoggedOut],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'account',
    component: AccountFormComponent,
    canActivate: [isLoggedIn],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'activate-account',
    component: ActivateAccountComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [isLoggedOut],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'forgot-password-check-mailbox',
    component: ForgotPasswordCheckMailboxComponent,
    canActivate: [isLoggedOut],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'reset-password/:hash',
    component: ResetPasswordComponent,
    canActivate: [isLoggedOut],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'change-email/:hash',
    component: ChangeEmailComponent,
    canActivate: [isLoggedIn],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'instance-settings',
    component: InstanceSettingsFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'users',
    component: UserListComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    }
  },
  {
    path: 'users/:user-slug',
    component: UserDetailComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.AUTH
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: UserAscentsComponent,
        outlet: 'userContent'
      }
    ]
  },
  {
    path: 'ascents',
    redirectTo: 'topo/ascents'
  },
  {
    path: 'topo',
    component: RegionComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        children: [
          {
            path: '',
            component: RegionInfoComponent,
            outlet: 'regionContent'
          }
        ]
      },
      {
        path: 'crags',
        children: [
          {
            path: '',
            component: CragListComponent,
            outlet: 'regionContent'
          }
        ]
      },
      {
        path: 'rules',
        children: [
          {
            path: '',
            component: RegionRulesComponent,
            outlet: 'regionContent'
          }
        ]
      },
      {
        path: 'gallery',
        redirectTo: ''
      },
      {
        path: 'ascents',
        children: [
          {
            path: '',
            component: RegionAscentsComponent,
            outlet: 'regionContent'
          }
        ]
      },
    ]
  },
  {
    path: 'topo/edit-region',
    component: RegionFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/create-crag',
    component: CragFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug',
    component: CragComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    },
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
        path: 'rules',
        children: [
          {
            path: '',
            component: CragRulesComponent,
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
        children: [
          {
            path: '',
            component: CragAscentsComponent,
            outlet: 'cragContent'
          }
        ]
      },
    ]
  },
  {
    path: 'topo/:crag-slug/edit',
    component: CragFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/create-sector',
    component: SectorFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug',
    component: SectorComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    },
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
        path: 'rules',
        children: [
          {
            path: '',
            component: SectorRulesComponent,
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
        children: [
          {
            path: '',
            component: SectorAscentsComponent,
            outlet: 'sectorContent'
          }
        ]
      },
    ]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/edit',
    component: SectorFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug/create-area',
    component: AreaFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/create-line',
    component: LineFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/add-topo-image',
    component: TopoImageFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/topo-images/:image-id/edit',
    component: TopoImageFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug',
    component: AreaComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    },
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
        children: [
          {
            path: '',
            component: AreaAscentsComponent,
            outlet: 'areaContent'
          }
        ]
      },
    ]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/edit',
    component: AreaFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/:line-slug',
    component: LineComponent,
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    },
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: LineInfoComponent,
        outlet: 'lineContent'
      },
      {
        path: 'ascents',
        children: [
          {
            path: '',
            component: LineAscentsComponent,
            outlet: 'lineContent'
          }
        ]
      },
    ]
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/:line-slug/edit',
    component: LineFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    path: 'topo/:crag-slug/:sector-slug/:area-slug/topo-images/:topo-image-id/add-line-path',
    component: LinePathFormComponent,
    canActivate: [isModerator],
    data: {
      backgroundImagePath: StaticBackgroundImages.DEFAULT
    }
  },
  {
    component: NotFoundComponent,
    path: '**',
    data: {
      backgroundImagePath: StaticBackgroundImages.NOT_FOUND
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class CoreRoutingModule {
}
