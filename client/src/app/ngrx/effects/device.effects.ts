import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {map} from 'rxjs/operators';
import {checkIsMobile, setIsMobile} from '../actions/device.actions';
import * as MobileDetect from 'mobile-detect';

/**
 * Effects for device actions.
 */
@Injectable()
export class DeviceEffects {

  /**
   * Checks if the device is a mobile devices and notifies the app about it.
   */
  onCheckIsMobile = createEffect(() => this.actions$.pipe(
    ofType(checkIsMobile),
    map(() => {
      const md = new MobileDetect(window.navigator.userAgent);
      return setIsMobile({isMobile: md.isPhoneSized()});
    })
  ));

  constructor(
    private actions$: Actions) {
  }

}
