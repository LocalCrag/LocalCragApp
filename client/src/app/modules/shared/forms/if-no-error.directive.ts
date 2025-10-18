import {
  Directive,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { ControlGroupService } from './control-group.service';
import { Subscription } from 'rxjs';

/**
 * Directive for rendering cds control messages depending on the error state of the control group.
 * If there are any errors, the control is not rendered. Instead, the error messages should be shown using appropriate
 * bchIfError directives.
 */
@Directive({
  selector: '[lcIfNoError]',
})
export class IfNoErrorDirective implements OnInit, OnDestroy {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private controlGroupService = inject(ControlGroupService);
  private viewContainer = inject(ViewContainerRef);
  private hasView = false;
  private hasErrorSubscription: Subscription;

  /**
   * Initially creates the view and subscribes to the form controls error state changes to
   * conditionally show or hide the view.
   */
  ngOnInit() {
    this.createView();
    this.hasErrorSubscription = this.controlGroupService.hasError.subscribe(
      (hasError) => {
        if (hasError) {
          this.destroyView();
        } else {
          this.createView();
        }
      },
    );
  }

  /**
   * Clean up observable subscriptions when the directives life ends.
   */
  ngOnDestroy() {
    this.hasErrorSubscription?.unsubscribe();
  }

  /**
   * Creates the view if it is not already shown.
   */
  createView() {
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }

  /**
   * Clears the view container if the view was previously shown.
   */
  destroyView() {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
