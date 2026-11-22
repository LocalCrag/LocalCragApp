import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCondicasterEnabled } from '../../../ngrx/selectors/instance-settings.selectors';

@Directive({
  selector:
    // eslint-disable-next-line  @angular-eslint/directive-selector
    '[isCondicasterEnabled]',
})
export class CondicasterEnabledDirective {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);
  private store = inject(Store);

  @Input()
  set isCondicasterEnabled(value: boolean) {
    this.store.select(selectCondicasterEnabled).subscribe((enabled) => {
      this.decideView(enabled === value);
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
