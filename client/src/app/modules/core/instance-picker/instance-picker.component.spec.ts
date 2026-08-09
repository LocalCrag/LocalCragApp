import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { InstancePickerComponent } from './instance-picker.component';
import { RUNTIME_API_HOST } from '../../../services/core/runtime-api-host';
import {
  LiveSessionEndHandlers,
  RockExplorerLiveSessionGuard,
} from '../../../services/core/rock-explorer-live-session.guard';

describe('InstancePickerComponent', () => {
  let fixture: ComponentFixture<InstancePickerComponent>;
  let component: InstancePickerComponent;
  let liveGuard: RockExplorerLiveSessionGuard;
  let confirmation: ConfirmationService;

  const activeHost = 'http://10.0.2.2:5000';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstancePickerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RockExplorerLiveSessionGuard,
        DialogService,
        { provide: RUNTIME_API_HOST, useValue: activeHost },
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
            reRenderOnLangChange: true,
          },
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InstancePickerComponent);
    component = fixture.componentInstance;
    liveGuard = TestBed.inject(RockExplorerLiveSessionGuard);
    confirmation = fixture.debugElement.injector.get(ConfirmationService);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('same-host switchTo leaves home without runGuardedAction or Finish/Discard (D-08)', () => {
    const enterHome = spyOn(
      component as unknown as { enterInstanceHome: () => void },
      'enterInstanceHome',
    );
    const runGuarded = spyOn(liveGuard, 'runGuardedAction').and.resolveTo();
    const confirmSpy = spyOn(confirmation, 'confirm');
    liveGuard.setLiveSession(true, {
      finish: async () => undefined,
      discard: async () => undefined,
    } satisfies LiveSessionEndHandlers);

    component.switchTo({
      url: activeHost,
      instanceName: 'Current',
    });

    expect(enterHome).toHaveBeenCalled();
    expect(runGuarded).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('different-host switchTo invokes runGuardedAction before setActiveHost when live (D-06)', () => {
    const runGuarded = spyOn(liveGuard, 'runGuardedAction').and.callFake(
      async (action) => {
        await action();
      },
    );
    liveGuard.setLiveSession(true, {
      finish: async () => {
        liveGuard.setLiveSession(false);
      },
      discard: async () => {
        liveGuard.setLiveSession(false);
      },
    });

    component.switchTo({
      url: 'https://other.example',
      instanceName: 'Other',
    });

    // RED until plan 02 wraps host-change in runGuardedAction before setActiveHost.
    expect(runGuarded).toHaveBeenCalled();
  });
});
