import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectGymMode } from '../../../ngrx/selectors/instance-settings.selectors';

@Directive({
  selector:
    // eslint-disable-next-line  @angular-eslint/directive-selector
    '[isGymMode]',
  standalone: true,
})
export class GymModeDirective {
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef,
    private store: Store,
  ) {}

  @Input()
  set isGymMode(value: boolean) {
    this.store.select(selectGymMode).subscribe((gymMode) => {
      this.decideView(gymMode == value);
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
