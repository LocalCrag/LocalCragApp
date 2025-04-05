import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { ControlGroupService } from './control-group.service';
import { Subscription } from 'rxjs';
import { NgControl } from '@angular/forms';

/**
 * Directive for rendering lc control messages depending on the error state of the control. If the specified error
 * is present, the control message is rendered, if not it is hidden.
 */
@Directive({
  selector: '[lcIfError]',
  standalone: false,
})
export class IfErrorDirective implements OnInit, OnDestroy {
  @Input() lcIfErrorControlName: string = null; // Name of the Angular control on which to look for errors
  @Input() lcIfError: string; // Name of the error to react on

  private hasView = false;
  private control: NgControl;
  private touched = false;
  private controlElementTouchedChangesSubscription: Subscription;
  private statusChangesSubscription: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private controlGroupService: ControlGroupService,
    private viewContainer: ViewContainerRef,
  ) {}

  /**
   * First, the view is destroyed as the initial state of the form is untouched. Then the control is fetched by using
   * the set control name and status and touched events are subscribed to react on changes by showing or hiding
   * the error messages.
   */
  ngOnInit() {
    this.destroyView();
    this.control = this.controlGroupService.getControl(
      this.lcIfErrorControlName,
    );
    // When the control becomes touched, we may need to show the error messages
    this.controlElementTouchedChangesSubscription = this.controlGroupService
      .controlElementTouchedChanges(this.lcIfErrorControlName)
      .subscribe((touched) => {
        this.touched = touched;
        this.checkStatus();
      });
    // When the control's status (valid, invalid etc.) changes, we may need to show the error messages
    if (this.control.statusChanges) {
      this.statusChangesSubscription = this.control.statusChanges.subscribe(
        () => {
          this.checkStatus();
        },
      );
    }
  }

  /**
   * Unsubscribes from Observables when the directives life ends.
   */
  ngOnDestroy() {
    this.controlElementTouchedChangesSubscription?.unsubscribe();
    this.statusChangesSubscription?.unsubscribe();
  }

  /**
   * Checks the current state of the directive. If the control is invalid and has been touched the view is created
   * (meaning the error message is shown). If not, it is destroyed. In any case the FormControlService is notified
   * about probable error state changes. This is needed for the ifNoError directive to show or hide the other
   * control messages accordingly.
   */
  checkStatus() {
    if (
      this.control.invalid &&
      this.touched &&
      this.control.errors !== null &&
      this.lcIfError in this.control.errors
    ) {
      this.createView();
    } else {
      this.destroyView();
    }
    this.controlGroupService.onErrorStateChange();
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
