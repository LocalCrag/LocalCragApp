import {Directive, Input, Renderer2, TemplateRef, ViewContainerRef} from '@angular/core';
import {Store} from '@ngrx/store';
import {UserPromotionTargets} from '../../../enums/user-promotion-targets';
import {selectIsAdmin, selectIsLoggedIn, selectIsModerator} from '../../../ngrx/selectors/auth.selectors';


@Directive({
  selector: '[isAdmin], [isModerator], [isLoggedIn], [isLoggedOut]',
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
