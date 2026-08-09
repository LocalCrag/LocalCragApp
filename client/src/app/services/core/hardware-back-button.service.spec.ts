import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import {
  EXIT_APP,
  HardwareBackButtonService,
} from './hardware-back-button.service';

describe('HardwareBackButtonService', () => {
  let service: HardwareBackButtonService;
  let location: jasmine.SpyObj<Location>;
  let exitApp: jasmine.Spy<() => void>;
  let keydownHandler: jasmine.Spy;

  beforeEach(() => {
    location = jasmine.createSpyObj('Location', ['back']);
    exitApp = jasmine.createSpy('exitApp');

    TestBed.configureTestingModule({
      providers: [
        { provide: Location, useValue: location },
        { provide: EXIT_APP, useValue: exitApp },
      ],
    });
    service = TestBed.inject(HardwareBackButtonService);

    keydownHandler = jasmine.createSpy('keydownHandler');
    document.addEventListener('keydown', keydownHandler);
  });

  afterEach(() => {
    document.removeEventListener('keydown', keydownHandler);
    document
      .querySelectorAll('.p-dialog-mask, .p-popover')
      .forEach((el) => el.remove());
  });

  it('dismissTopOverlayIfAny() returns false and dispatches no keydown event when no overlay is present', () => {
    expect(service.dismissTopOverlayIfAny()).toBeFalse();
    expect(keydownHandler).not.toHaveBeenCalled();
  });

  it('dismissTopOverlayIfAny() returns true and dispatches one Escape keydown when a .p-dialog-mask is open', () => {
    const mask = document.createElement('div');
    mask.className = 'p-dialog-mask';
    document.body.appendChild(mask);

    expect(service.dismissTopOverlayIfAny()).toBeTrue();
    expect(keydownHandler).toHaveBeenCalledTimes(1);
    const event = keydownHandler.calls.mostRecent().args[0] as KeyboardEvent;
    expect(event.key).toBe('Escape');
  });

  it('dismissTopOverlayIfAny() returns true and dispatches one Escape keydown when a .p-popover is open', () => {
    const popover = document.createElement('div');
    popover.className = 'p-popover';
    document.body.appendChild(popover);

    expect(service.dismissTopOverlayIfAny()).toBeTrue();
    expect(keydownHandler).toHaveBeenCalledTimes(1);
    const event = keydownHandler.calls.mostRecent().args[0] as KeyboardEvent;
    expect(event.key).toBe('Escape');
  });

  it('handleBackPress(true) with an open overlay returns overlay-dismissed and does not navigate or exit', () => {
    const mask = document.createElement('div');
    mask.className = 'p-dialog-mask';
    document.body.appendChild(mask);

    expect(service.handleBackPress(true)).toBe('overlay-dismissed');
    expect(location.back).not.toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('handleBackPress(true) with no overlay returns navigated and calls Location.back exactly once', () => {
    expect(service.handleBackPress(true)).toBe('navigated');
    expect(location.back).toHaveBeenCalledTimes(1);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('handleBackPress(false) with no overlay returns exited and calls EXIT_APP exactly once', () => {
    expect(service.handleBackPress(false)).toBe('exited');
    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(location.back).not.toHaveBeenCalled();
  });

  it('register() does not throw when Capacitor.isNativePlatform() is false', () => {
    expect(() => service.register()).not.toThrow();
  });
});
