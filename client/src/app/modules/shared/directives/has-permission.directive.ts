import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectCurrentUser,
  selectIsAdmin,
  selectIsLoggedIn,
  selectIsMember,
  selectIsModerator,
  selectIsSuperadmin,
} from '../../../ngrx/selectors/auth.selectors';
import { User } from '../../../models/user';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@Directive({
  selector:
    // eslint-disable-next-line  @angular-eslint/directive-selector
    '[isAdmin], [isSuperadmin], [isModerator], [isLoggedIn], [isLoggedOut], [isOwnUser], [isMember]',
})
@UntilDestroy()
export class HasPermissionDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef,
    private store: Store,
  ) {}

  @Input()
  set isOwnUser(testUser: User) {
    if (testUser) {
      this.store
        .select(selectCurrentUser)
        .pipe(untilDestroyed(this))
        .subscribe((user) => {
          this.decideView(!!user && testUser.id === user.id);
        });
    }
  }

  @Input()
  set isSuperadmin(value: boolean) {
    this.store
      .select(selectIsSuperadmin)
      .pipe(untilDestroyed(this))
      .subscribe((isSuperadmin) => {
        if (value) {
          this.decideView(isSuperadmin);
        } else {
          this.decideView(!isSuperadmin);
        }
      });
  }

  @Input()
  set isAdmin(value: boolean) {
    this.store
      .select(selectIsAdmin)
      .pipe(untilDestroyed(this))
      .subscribe((isAdmin) => {
        if (value) {
          this.decideView(isAdmin);
        } else {
          this.decideView(!isAdmin);
        }
      });
  }

  @Input()
  set isModerator(value: boolean) {
    this.store
      .select(selectIsModerator)
      .pipe(untilDestroyed(this))
      .subscribe((isModerator) => {
        if (value) {
          this.decideView(isModerator);
        } else {
          this.decideView(!isModerator);
        }
      });
  }

  @Input()
  set isMember(value: boolean) {
    this.store
      .select(selectIsMember)
      .pipe(untilDestroyed(this))
      .subscribe((isMember) => {
        if (value) {
          this.decideView(isMember);
        } else {
          this.decideView(!isMember);
        }
      });
  }

  @Input()
  set isLoggedIn(value: boolean) {
    this.store
      .select(selectIsLoggedIn)
      .pipe(untilDestroyed(this))
      .subscribe((isLoggedIn) => {
        if (value) {
          this.decideView(isLoggedIn);
        } else {
          this.decideView(!isLoggedIn);
        }
      });
  }

  @Input()
  set isLoggedOut(value: boolean) {
    this.store
      .select(selectIsLoggedIn)
      .pipe(untilDestroyed(this))
      .subscribe((isLoggedIn) => {
        if (value) {
          this.decideView(!isLoggedIn);
        } else {
          this.decideView(isLoggedIn);
        }
      });
  }

  decideView(show: boolean) {
    if (show) {
      this.showComponent();
    } else {
      this.removeComponent();
    }
  }

  removeComponent(): void {
    this.viewContainerRef.clear();
  }

  showComponent(): void {
    this.viewContainerRef.clear();
    this.viewContainerRef.createEmbeddedView(this.templateRef);
  }
}
