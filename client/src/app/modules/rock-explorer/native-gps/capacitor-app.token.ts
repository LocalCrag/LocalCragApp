import { InjectionToken } from '@angular/core';
import { App, type AppPlugin } from '@capacitor/app';

/**
 * Injectable Capacitor App seam so unit tests never touch the real plugin proxy
 * (mirror EXIT_APP / GPS_BRIDGE). Facade registers appStateChange → flush in plan 03.
 */
export const CAPACITOR_APP = new InjectionToken<AppPlugin>('CAPACITOR_APP', {
  providedIn: 'root',
  factory: () => App,
});
