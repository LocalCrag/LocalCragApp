import { Component, OnInit, inject } from '@angular/core';
import { AscentListComponent } from '../../ascent/ascent-list/ascent-list.component';
import { UsersService } from '../../../services/crud/users.service';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { User } from '../../../models/user';
import { NgForOf, NgIf } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-user-ascents',
  imports: [AscentListComponent, NgIf, SkeletonModule, NgForOf],
  templateUrl: './user-ascents.component.html',
  styleUrl: './user-ascents.component.scss',
})
export class UserAscentsComponent implements OnInit {
  public user: User;

  private usersService = inject(UsersService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const userSlug =
      this.route.snapshot.parent.parent.paramMap.get('user-slug');
    this.usersService
      .getUser(userSlug)
      .pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        }),
      )
      .subscribe((user) => {
        this.user = user;
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${user.firstname} ${user.lastname} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
          );
        });
      });
  }
}
