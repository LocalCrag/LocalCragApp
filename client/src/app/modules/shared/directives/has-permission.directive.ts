import {Directive, Input, Renderer2, TemplateRef, ViewContainerRef} from '@angular/core';
import {Store} from '@ngrx/store';
import {UserPromotionTargets} from '../../../enums/user-promotion-targets';
import {
  selectCurrentUser,
  selectIsAdmin,
  selectIsLoggedIn, selectIsMember,
  selectIsModerator
} from '../../../ngrx/selectors/auth.selectors';
import {User} from '../../../models/user';


@Directive({
  selector: '[isAdmin], [isModerator], [isLoggedIn], [isLoggedOut], [isOwnUser], [isMember]',
  standalone: true
})
export class HasPermissionDirective {

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef,
    private store: Store
  ) {
  }

  @Input()
  set isOwnUser(testUser: User) {
    if (testUser) {
      this.store.select(selectCurrentUser).subscribe(user => {
        this.decideView(testUser.id === user.id);
      })
    }
  }

  @Input()
  set isAdmin(value: boolean) {
    if (value) {
      this.store.select(selectIsAdmin).subscribe(isAdmin => {
        this.decideView(isAdmin);
      })
    }
  }

  @Input()
  set isModerator(value: boolean) {
    if (value) {
      this.store.select(selectIsModerator).subscribe(isModerator => {
        this.decideView(isModerator);
      })
    }
  }

  @Input()
  set isMember(value: boolean) {
    if (value) {
      this.store.select(selectIsMember).subscribe(isMember => {
        this.decideView(isMember);
      })
    }
  }

  @Input()
  set isLoggedIn(value: boolean) {
    if (value) {
      this.store.select(selectIsLoggedIn).subscribe(isLoggedIn => {
        this.decideView(isLoggedIn);
      })
    }
  }

  @Input()
  set isLoggedOut(value: boolean) {
    if (value) {
      this.store.select(selectIsLoggedIn).subscribe(isLoggedIn => {
        this.decideView(!isLoggedIn);
      })
    }
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
