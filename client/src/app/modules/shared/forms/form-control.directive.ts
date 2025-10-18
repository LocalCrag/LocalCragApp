import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { ControlGroupService } from './control-group.service';
import { NgControl, TouchedChangeEvent } from '@angular/forms';

/**
 * A directive that is responsible for watching the touched state of a form control and for registering
 * an NgControl as ControlElement to the ControlGroupService.
 */
@Directive({
  selector: '[lcFormControl]',
})
export class FormControlDirective implements OnInit, OnDestroy {
  private ngControl = inject(NgControl);
  private el = inject(ElementRef);
  private controlGroupService = inject(ControlGroupService);
  private fromEventSubscription: Subscription;

  /**
   * Register the control element. on the ControlGroupService.
   */
  ngOnInit() {
    // Create an Observable that emits on blur events and when manually triggered
    const touchedChangedSubject = new Subject<boolean>();
    this.fromEventSubscription = fromEvent(
      this.el.nativeElement,
      'blur',
    ).subscribe(() => touchedChangedSubject.next(true));
    const touchedChanged = touchedChangedSubject.asObservable();
    // Also listen to programmatic touched changes (e.g. when the user tabs out of the field)
    this.ngControl.control.events.subscribe((event) => {
      if (event instanceof TouchedChangeEvent) {
        if (event.touched) {
          touchedChangedSubject.next(true);
        }
      }
    });
    // Register control on the ControlGroupService
    this.controlGroupService.registerControlElement({
      control: this.ngControl,
      touchedChanged,
      touchedChangedSubject,
      name: this.ngControl.name,
    });
    this.ngControl.statusChanges.subscribe(() => {
      this.controlGroupService.onDisabledStateChange();
    });
  }

  /**
   * Unsubscribes from Observables.
   */
  ngOnDestroy() {
    this.fromEventSubscription.unsubscribe();
  }
}
