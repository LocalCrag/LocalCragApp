import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  LiveSessionEndHandlers,
  RockExplorerLiveSessionGuard,
} from './rock-explorer-live-session.guard';

/**
 * Wave 0 RED specs for INST-07 (D-01…D-05, D-14).
 * Plan 02 makes these GREEN by wiring DynamicDialog via DialogService.open
 * returning a ref whose onClose emits 'finish' | 'discard' | 'cancel'.
 * Do not rename these expects when implementing.
 */
describe('RockExplorerLiveSessionGuard', () => {
  let guard: RockExplorerLiveSessionGuard;
  let dialogService: jasmine.SpyObj<DialogService>;
  let handlers: jasmine.SpyObj<LiveSessionEndHandlers>;
  let onClose$: Subject<'finish' | 'discard' | 'cancel' | undefined>;

  beforeEach(() => {
    onClose$ = new Subject();
    const dialogRef = {
      onClose: onClose$.asObservable(),
      close: jasmine.createSpy('close'),
    } as unknown as DynamicDialogRef;

    dialogService = jasmine.createSpyObj<DialogService>('DialogService', [
      'open',
    ]);
    dialogService.open.and.returnValue(dialogRef);

    handlers = jasmine.createSpyObj<LiveSessionEndHandlers>(
      'LiveSessionEndHandlers',
      ['finish', 'discard'],
    );
    handlers.finish.and.callFake(async () => {
      guard.setLiveSession(false);
    });
    handlers.discard.and.callFake(async () => {
      guard.setLiveSession(false);
    });

    TestBed.configureTestingModule({
      providers: [
        RockExplorerLiveSessionGuard,
        { provide: DialogService, useValue: dialogService },
      ],
    });
    guard = TestBed.inject(RockExplorerLiveSessionGuard);
  });

  it('setLiveSession(true) → isLive() true; setLiveSession(false) → isLive() false', () => {
    expect(guard.isLive()).toBeFalse();
    guard.setLiveSession(true, handlers);
    expect(guard.isLive()).toBeTrue();
    guard.setLiveSession(false);
    expect(guard.isLive()).toBeFalse();
  });

  it('isLive is independent of idle Dexie drafts (D-05) — only setLiveSession controls the predicate', () => {
    // Idle drafts / hasRecordingSession / Dexie queue must NOT flip isLive.
    expect(guard.isLive()).toBeFalse();
    guard.setLiveSession(true, handlers);
    expect(guard.isLive()).toBeTrue();
    // Clearing live (exit Record) leaves any idle draft out of scope for the guard.
    guard.setLiveSession(false);
    expect(guard.isLive()).toBeFalse();
  });

  it('when !isLive, runGuardedAction runs action immediately with no resolve dialog (passthrough)', async () => {
    const action = jasmine.createSpy('action').and.resolveTo(undefined);
    expect(guard.isLive()).toBeFalse();

    await guard.runGuardedAction(action);

    expect(action).toHaveBeenCalledTimes(1);
    expect(dialogService.open).not.toHaveBeenCalled();
    expect(handlers.finish).not.toHaveBeenCalled();
    expect(handlers.discard).not.toHaveBeenCalled();
  });

  it('when isLive + Cancel: pending action does not run; session stays live (D-02)', async () => {
    guard.setLiveSession(true, handlers);
    const action = jasmine.createSpy('action');

    const pending = guard.runGuardedAction(action);
    expect(dialogService.open).toHaveBeenCalled();
    onClose$.next('cancel');
    onClose$.complete();
    await pending;

    expect(action).not.toHaveBeenCalled();
    expect(guard.isLive()).toBeTrue();
    expect(handlers.finish).not.toHaveBeenCalled();
    expect(handlers.discard).not.toHaveBeenCalled();
  });

  it('when isLive + Finish: awaits handlers.finish then runs pending action; isLive false (D-03)', async () => {
    guard.setLiveSession(true, handlers);
    const action = jasmine.createSpy('action').and.resolveTo(undefined);

    const pending = guard.runGuardedAction(action);
    expect(dialogService.open).toHaveBeenCalled();
    onClose$.next('finish');
    onClose$.complete();
    await pending;

    expect(handlers.finish).toHaveBeenCalledTimes(1);
    expect(handlers.discard).not.toHaveBeenCalled();
    expect(action).toHaveBeenCalledTimes(1);
    expect(guard.isLive()).toBeFalse();
  });

  it('when isLive + Discard: awaits handlers.discard then runs pending action; isLive false (D-04)', async () => {
    guard.setLiveSession(true, handlers);
    const action = jasmine.createSpy('action').and.resolveTo(undefined);

    const pending = guard.runGuardedAction(action);
    expect(dialogService.open).toHaveBeenCalled();
    onClose$.next('discard');
    onClose$.complete();
    await pending;

    expect(handlers.discard).toHaveBeenCalledTimes(1);
    expect(handlers.finish).not.toHaveBeenCalled();
    expect(action).toHaveBeenCalledTimes(1);
    expect(guard.isLive()).toBeFalse();
  });

  it('never runs pending action while isLive remains true (D-01 — no soft continue)', async () => {
    guard.setLiveSession(true, {
      finish: async () => {
        /* deliberately leave live true — soft-continue / orphan forbid */
      },
      discard: async () => {
        /* deliberately leave live true */
      },
    });
    const action = jasmine.createSpy('action');

    const pending = guard.runGuardedAction(action);
    onClose$.next('finish');
    onClose$.complete();
    await pending;

    expect(guard.isLive()).toBeTrue();
    expect(action).not.toHaveBeenCalled();
  });
});
