import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { selectGymMode } from '../../../ngrx/selectors/instance-settings.selectors';

@Directive({
  selector:
    // eslint-disable-next-line  @angular-eslint/directive-selector
    '[isGymMode]',
})
export class GymModeDirective {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);
  private store = inject(Store);

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
