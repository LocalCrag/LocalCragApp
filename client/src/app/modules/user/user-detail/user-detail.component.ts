import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { NgIf } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { MenuItem } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { User } from '../../../models/user';
import { UsersService } from '../../../services/crud/users.service';
import { AvatarModule } from 'primeng/avatar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SetActiveTabDirective } from '../../shared/directives/set-active-tab.directive';
import { Tab, TabList, Tabs } from 'primeng/tabs';

@Component({
  selector: 'lc-user-detail',
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    RouterOutlet,
    AvatarModule,
    SetActiveTabDirective,
    Tab,
    TabList,
    Tabs,
    RouterLink,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  encapsulation: ViewEncapsulation.None,
})
@UntilDestroy()
export class UserDetailComponent implements OnInit {
  public user: User;
  public items: MenuItem[];

  constructor(
    private usersService: UsersService,
    private translocoService: TranslocoService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      const userSlug = params.get('user-slug');
      forkJoin([
        this.usersService.getUser(userSlug).pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        ),
      ]).subscribe(([user]) => {
        this.user = user;
        this.items = [
          {
            label: this.translocoService.translate(marker('user.ascents')),
            icon: 'pi pi-fw pi-check-square',
            routerLink: `/users/${userSlug}/ascents`,
            routerLinkActiveOptions: { exact: true },
            visible: true,
          },
          {
            label: this.translocoService.translate(marker('user.charts')),
            icon: 'pi pi-fw pi-chart-bar',
            routerLink: `/users/${userSlug}/charts`,
            routerLinkActiveOptions: { exact: true },
            visible: true,
          },
          {
            label: this.translocoService.translate(marker('user.gallery')),
            icon: 'pi pi-fw pi-images',
            routerLink: `/users/${userSlug}/gallery`,
            visible: true,
          },
        ];
      });
    });
  }
}
