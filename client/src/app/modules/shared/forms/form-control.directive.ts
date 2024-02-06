import {Directive, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {fromEvent, Subject, Subscription} from 'rxjs';
import {ControlGroupService} from './control-group.service';
import {NgControl} from '@angular/forms';
import {UntilDestroy} from '@ngneat/until-destroy';

/**
 * A directive that is responsible for watching the touched state of a form control and for registering
 * an NgControl as ControlElement to the ControlGroupService.
 */
@Directive({
  selector: '[lcFormControl]'
})
@UntilDestroy()
export class FormControlDirective  implements OnInit, OnDestroy {

  private fromEventSubscription: Subscription;

  constructor(private ngControl: NgControl,
              private el: ElementRef,
              private controlGroupService: ControlGroupService) {
  }

  /**
   * Register the control element. on the ControlGroupService.
   */
  ngOnInit() {
    // Create an Observable that emits on blur events and when manually triggered
    const touchedChangedSubject = new Subject<boolean>();
    this.fromEventSubscription = fromEvent(this.el.nativeElement, 'blur')
      .subscribe(() => touchedChangedSubject.next(true));
    const touchedChanged = touchedChangedSubject.asObservable();
    // Register control on the ControlGroupService
    this.controlGroupService.registerControlElement({
      control: this.ngControl,
      touchedChanged,
      touchedChangedSubject,
      name: this.ngControl.name
    });
    this.ngControl.statusChanges.pipe().subscribe(() => {
      this.controlGroupService.onDisabledStateChange();
    })
  }

  /**
   * Unsubscribes from Observables.
   */
  ngOnDestroy() {
    this.fromEventSubscription.unsubscribe();
  }

}
