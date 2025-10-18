import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { NgControl } from '@angular/forms';
import { FormService } from './form.service';
import { ControlElement } from './control-element.interface';

/**
 * Service that manages the error states of a control group.
 * A control group in this sense are a number of form controls that share the same block for error and info
 * control messages. In most cases this is just a single input but it can also be an input group (value + unit).
 */
@Injectable({
  providedIn: 'root',
})
export class ControlGroupService {
  private controlElements: { [key: string]: ControlElement } = {};
  private hasErrorSubject: Subject<boolean> = new Subject<boolean>();
  private hasErrorAndIsTouchedSubject: Subject<boolean> =
    new Subject<boolean>();
  private isDisabledSubject: Subject<boolean> = new Subject<boolean>();

  private formService = inject(FormService);

  constructor() {
    this.formService.addControlGroupService(this);
  }

  /**
   * Adds a new control element to the service.
   *
   * @param controlElement Element to register.
   */
  public registerControlElement(controlElement: ControlElement) {
    if (typeof controlElement.name === 'string') {
      this.controlElements[controlElement.name] = controlElement;
    }
    this.onDisabledStateChange(); // Compute initial disabled state
  }

  /**
   * Returns the TouchedChangesObservable for the control with the given name.
   * If no name is given and only one control is present, this controls value is
   * returned.
   *
   * @param name Name of the control for which to get the Observable stream.
   */
  public controlElementTouchedChanges(
    name: string = null,
  ): Observable<boolean> {
    const controlElementValues = Object.values(this.controlElements);
    if (controlElementValues.length === 1 && name === null) {
      return controlElementValues[0].touchedChanged;
    }
    return this.controlElements[name].touchedChanged;
  }

  /**
   * Returns the control with the given name. If no name is given and only one control is present, this control is
   * returned.
   *
   * @param name Name of the control to get.
   */
  public getControl(name: string = null): NgControl {
    const controlElementValues = Object.values(this.controlElements);
    if (controlElementValues.length === 1 && name === null) {
      return controlElementValues[0].control;
    }
    try {
      return this.controlElements[name].control;
    } catch (e) {
      if (e instanceof TypeError) {
        throw new Error(`Could not get control with name "${name}"`);
      } else {
        throw e;
      }
    }
  }

  /**
   * Called by the ifError directives. Each time a single error state changes, this function will check the combined
   * error state of the control group and forward it to the ifNoError directives via the hasError Observable stream.
   * A combined state is needed, as the hint control messages are supposed to vanish as soon as a single error occurs.
   * Multiple errors on the same control group can be possible.
   */
  public onErrorStateChange() {
    let hasError = false;
    let isTouched = false;
    Object.values(this.controlElements).map((controlElement) => {
      hasError = hasError || !!controlElement.control.invalid;
      isTouched = isTouched || !!controlElement.control.touched;
    });
    this.hasErrorSubject.next(hasError);
    this.hasErrorAndIsTouchedSubject.next(hasError && isTouched);
  }

  /**
   * Called by the formControl directives. Each time a single disabled state changes, this function will check the
   * combined disabled state of the control group. The complete control group is disabled when all contained
   * controls are disabled. In this case the `disabled` class is set on the controlGroup host element and the state
   * can thus be visualized via CSS.
   */
  public onDisabledStateChange() {
    let isDisabled = true;
    Object.values(this.controlElements).map((controlElement) => {
      isDisabled = isDisabled && controlElement.control.disabled;
    });
    this.isDisabledSubject.next(isDisabled);
  }

  /**
   * Returns the hasError Observable which emits the current combined error state.
   */
  public get hasError(): Observable<boolean> {
    return this.hasErrorSubject.asObservable();
  }

  /**
   * Returns the hasErrorAndIsTouched Observable which emits the current combined error/touched state.
   */
  public hasErrorAndIsTouched(): Observable<boolean> {
    return this.hasErrorAndIsTouchedSubject.asObservable();
  }

  /**
   * Returns the isDisabled Observable which emits the current disabled state.
   */
  public isDisabled(): Observable<boolean> {
    return this.isDisabledSubject.asObservable();
  }

  /**
   * Maks all control elements in the group as touched.
   */
  public markAsTouched() {
    Object.values(this.controlElements).map((controlElement) => {
      controlElement.control.control?.markAllAsTouched();
      controlElement.control.control?.markAsDirty();
      controlElement.touchedChangedSubject.next(true);
    });
  }
}
