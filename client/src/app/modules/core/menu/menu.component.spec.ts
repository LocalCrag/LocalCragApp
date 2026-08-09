import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Actions } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslocoService } from '@jsverse/transloco';
import { MenuComponent } from './menu.component';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { LanguageService } from '../../../services/core/language.service';
import { ThemeService } from '../../../services/core/theme.service';
import { RockExplorerLiveSessionGuard } from '../../../services/core/rock-explorer-live-session.guard';
import { logout } from '../../../ngrx/actions/auth.actions';
import {
  selectAuthState,
  selectCurrentUser,
} from '../../../ngrx/selectors/auth.selectors';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import {
  selectDarkLogoImage,
  selectGymMode,
  selectInstanceName,
  selectLogoImage,
  selectSkippedHierarchyLayers,
} from '../../../ngrx/selectors/instance-settings.selectors';

/**
 * Wave 0 RED: D-06 Switch instance + D-07 user-initiated logout must call
 * RockExplorerLiveSessionGuard.runGuardedAction before navigate/dispatch.
 * Plan 02 adds switchInstance() and wraps logout — keep these expect names.
 */
describe('MenuComponent live-session guard hooks (D-06, D-07)', () => {
  let component: MenuComponent;
  let liveGuard: jasmine.SpyObj<RockExplorerLiveSessionGuard>;
  let router: jasmine.SpyObj<Router>;
  let store: MockStore;

  beforeEach(async () => {
    liveGuard = jasmine.createSpyObj<RockExplorerLiveSessionGuard>(
      'RockExplorerLiveSessionGuard',
      ['runGuardedAction', 'setLiveSession', 'isLive'],
    );
    liveGuard.runGuardedAction.and.callFake(async (action) => {
      await action();
    });
    liveGuard.isLive.and.returnValue(false);

    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAuthState, value: { user: null } },
            { selector: selectCurrentUser, value: null },
            { selector: selectIsMobile, value: false },
            { selector: selectInstanceName, value: 'Test' },
            { selector: selectLogoImage, value: null },
            { selector: selectDarkLogoImage, value: null },
            { selector: selectSkippedHierarchyLayers, value: 0 },
            { selector: selectGymMode, value: false },
          ],
        }),
        {
          provide: MenuItemsService,
          useValue: {
            getMenuItems: () => of([]),
            getCragMenuStructure: () => of([]),
          },
        },
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key },
        },
        {
          provide: DialogService,
          useValue: jasmine.createSpyObj('DialogService', ['open']),
        },
        { provide: Actions, useValue: new Subject() },
        {
          provide: LanguageService,
          useValue: {
            calculatedLanguage: 'en',
            renderedLanguage$: of('en'),
            setPreferredLanguage: jasmine.createSpy('setPreferredLanguage'),
          },
        },
        {
          provide: ThemeService,
          useValue: {
            isDarkMode: signal(false),
            toggleGuestColorScheme: jasmine.createSpy('toggleGuestColorScheme'),
          },
        },
        { provide: RockExplorerLiveSessionGuard, useValue: liveGuard },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(MenuComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    const fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('switchInstance invokes runGuardedAction before navigateByUrl("/instances") (D-06)', async () => {
    const switchInstance = (
      component as unknown as {
        switchInstance?: () => Promise<void>;
      }
    ).switchInstance;

    expect(switchInstance).toEqual(jasmine.any(Function));
    if (typeof switchInstance !== 'function') {
      return;
    }

    await switchInstance.call(component);

    expect(liveGuard.runGuardedAction).toHaveBeenCalled();
    const call = liveGuard.runGuardedAction.calls.mostRecent();
    expect(call).toBeDefined();
    if (!call) {
      return;
    }
    await (call.args[0] as () => void | Promise<void>)();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/instances');
  });

  it('logout invokes runGuardedAction before store.dispatch(logout) when user-initiated (D-07)', async () => {
    await Promise.resolve(component.logout());

    expect(liveGuard.runGuardedAction).toHaveBeenCalled();
    if (!liveGuard.runGuardedAction.calls.any()) {
      return;
    }
    const call = liveGuard.runGuardedAction.calls.mostRecent();
    await (call.args[0] as () => void | Promise<void>)();
    expect(store.dispatch).toHaveBeenCalledWith(
      logout({ isAutoLogout: false, silent: false }),
    );
  });
});
