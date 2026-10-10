import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { EMPTY, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TodoListComponent } from '../../todo/todo-list/todo-list.component';
import { UsersService } from '../../../services/crud/users.service';
import { User } from '../../../models/user';
import {
  selectAuthResolved,
  selectCurrentUser,
} from '../../../ngrx/selectors/auth.selectors';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';

@Component({
  selector: 'lc-user-todos',
  imports: [TodoListComponent],
  templateUrl: './user-todos.component.html',
})
export class UserTodosComponent implements OnInit {
  public user: User;
  public readOnly = true;
  public ready = false;

  private usersService = inject(UsersService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const userSlug =
          this.route.parent.parent.snapshot.paramMap.get('user-slug');
        this.ready = false;
        this.usersService
          .getUser(userSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          )
          .subscribe((user) => {
            this.user = user;
            this.store
              .select(selectAuthResolved)
              .pipe(
                filter((resolved) => resolved),
                switchMap(() =>
                  this.store.select(selectCurrentUser).pipe(take(1)),
                ),
                take(1),
              )
              .subscribe((currentUser) => {
                this.readOnly = currentUser?.id !== user.id;
                this.ready = true;
                this.store
                  .select(selectInstanceName)
                  .pipe(take(1))
                  .subscribe((instanceName) => {
                    this.title.setTitle(
                      `${user.firstname} ${user.lastname} / ${this.translocoService.translate(marker('user.todos'))} - ${instanceName}`,
                    );
                  });
              });
          });
      });
  }
}
