import { Directive, OnDestroy, OnInit, inject } from '@angular/core';
import { FormArrayName } from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ControlGroupService } from './control-group.service';

/**
 * Registers the host `formArrayName` with the surrounding control group so
 * array-level validators can be rendered with `*lcIfError`.
 *
 * Put it on the `formArrayName` element, inside `lcControlGroup`.
 * A form array has no blur target. Array errors are shown as soon as they
 * exist, which is how the scales form already presents them while editing.
 * `FormDirective.markAsTouched()` still marks the array and its children.
 */
@Directive({
  selector: '[lcFormArray]',
})
export class FormArrayDirective implements OnInit, OnDestroy {
  private formArrayName = inject(FormArrayName);
  private controlGroupService = inject(ControlGroupService);
  private touchedChangedSubject = new BehaviorSubject(true);
  private statusSubscription: Subscription;

  ngOnInit() {
    const control = this.formArrayName.control;
    const rawName = this.formArrayName.name;
    this.controlGroupService.registerControlElement({
      control,
      touchedChanged: this.touchedChangedSubject.asObservable(),
      touchedChangedSubject: this.touchedChangedSubject,
      name: rawName == null ? '' : String(rawName),
    });
    this.statusSubscription = control.statusChanges.subscribe(() => {
      this.controlGroupService.onDisabledStateChange();
    });
  }

  ngOnDestroy() {
    this.statusSubscription?.unsubscribe();
  }
}
