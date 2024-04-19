import {Component, ViewEncapsulation} from '@angular/core';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {CardModule} from 'primeng/card';
import {NgIf} from '@angular/common';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {MenuItem, SharedModule} from 'primeng/api';
import {TabMenuModule} from 'primeng/tabmenu';
import {TranslocoPipe, TranslocoService} from '@ngneat/transloco';
import {Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {User} from '../../../models/user';
import {UsersService} from '../../../services/crud/users.service';
import {AvatarModule} from 'primeng/avatar';

@Component({
  selector: 'lc-user-detail',
  standalone: true,
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    RouterOutlet,
    SharedModule,
    TabMenuModule,
    TranslocoPipe,
    AvatarModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class UserDetailComponent {

  public user: User;
  public items: MenuItem[];

  constructor(private usersService: UsersService,
              private translocoService: TranslocoService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const userSlug = this.route.snapshot.paramMap.get('user-slug');
    forkJoin([
      this.usersService.getUser(userSlug).pipe(catchError(e => {
        console.log(e);
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })),
    ]).subscribe(([user]) => {
      this.user = user;
      this.items = [
        {
          label: this.translocoService.translate(marker('user.ascents')),
          icon: 'pi pi-fw pi-check-square',
          routerLink: `/users/${userSlug}/ascents`,
          routerLinkActiveOptions: {exact: true}
        },
        {
          label: this.translocoService.translate(marker('user.charts')),
          icon: 'pi pi-fw pi-chart-bar',
          routerLink: `/users/${userSlug}/charts`,
          routerLinkActiveOptions: {exact: true}
        },
      ];
    })
  }

}
