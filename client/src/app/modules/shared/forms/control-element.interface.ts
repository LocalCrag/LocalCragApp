import {NgControl} from '@angular/forms';
import {Observable, Subject} from 'rxjs';

/**
 * Properties of a control element for registering it on the ControlGroupService.
 */
export interface ControlElement {
  control: NgControl; // Native Angular control
  touchedChangedSubject: Subject<boolean>; // Subject that is the source for touchedChanged
  touchedChanged: Observable<boolean>; // Stream that emits when the touched state of the element changes
  name: string | number | null; // Name of the control (most of the time the name of NgControl)
}
