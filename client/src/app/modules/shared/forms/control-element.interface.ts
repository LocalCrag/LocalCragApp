import { AbstractControl, NgControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';

/**
 * Properties of a control element for registering it on the ControlGroupService.
 * `control` is an NgControl for inputs and an AbstractControl for form arrays.
 */
export interface ControlElement {
  control: NgControl | AbstractControl;
  touchedChangedSubject: Subject<boolean>; // Subject that is the source for touchedChanged
  touchedChanged: Observable<boolean>; // Stream that emits when the touched state of the element changes
  name: string | number | null; // Name of the control (most of the time the name of NgControl)
}
