import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { EMPTY, forkJoin, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { User } from '../../../models/user';
import { UsersService } from '../../../services/crud/users.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../../services/core/language.service';
import { PageTitleService } from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-user-detail',
  imports: [RouterOutlet, UserAvatarComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class UserDetailComponent implements OnInit {
  @ViewChild('pageTitle', { read: TemplateRef })
  pageTitleTemplate: TemplateRef<unknown>;

  public user: User;
  public items: MenuItem[];

  private destroyRef = inject(DestroyRef);
  private usersService = inject(UsersService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private languageService = inject(LanguageService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const userSlug = params.get('user-slug');
        forkJoin([
          this.usersService.getUser(userSlug).pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          ),
        ]).subscribe(([user]) => {
          this.user = user;
          this.pageTitleService.setTitle(
            `${user.firstname} ${user.lastname}`.trim(),
            { template: this.pageTitleTemplate },
          );
          this.buildItems(userSlug);
          this.languageService.renderedLanguage$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((rendered) => {
              if (!rendered) return;
              this.buildItems(userSlug);
            });
        });
      });
  }

  private buildItems(userSlug: string) {
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
    this.pageTitleService.setTabs(this.items);
  }
}
