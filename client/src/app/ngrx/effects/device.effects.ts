import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map } from 'rxjs/operators';
import { checkIsMobile, setIsMobile } from '../actions/device.actions';

/**
 * Effects for device actions.
 */
@Injectable()
export class DeviceEffects {
  /**
   * Checks if the device is a mobile devices and notifies the app about it.
   */
  onCheckIsMobile = createEffect(() =>
    this.actions$.pipe(
      ofType(checkIsMobile),
      map(() => {
        return setIsMobile({ isMobile: window.innerWidth <= 800 });
      }),
    ),
  );

  constructor(private actions$: Actions) {}
}
