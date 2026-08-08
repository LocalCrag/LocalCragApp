import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConnectivityProbeService } from './connectivity-probe.service';
import { selectShowOfflineAlert } from '../../ngrx/selectors/app-level-alerts.selectors';
import { hideOfflineAlert } from '../../ngrx/actions/app-level-alerts.actions';
import { ApiService } from './api.service';
import { CONNECTIVITY_PROBE } from '../../utility/http-context/connectivity-probe.context';

describe('ConnectivityProbeService', () => {
  let httpMock: HttpTestingController;
  let store: MockStore;
  let api: ApiService;

  /** Mirror reducer: hide action clears the offline selector so polling stops. */
  function simulateOfflineAlertCleared(): void {
    store.overrideSelector(selectShowOfflineAlert, false);
    store.refreshState();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectShowOfflineAlert, value: false }],
        }),
        ApiService,
        ConnectivityProbeService,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
    api = TestBed.inject(ApiService);
    spyOn(store, 'dispatch').and.callThrough();
    TestBed.inject(ConnectivityProbeService);
  });

  afterEach(() => {
    simulateOfflineAlertCleared();
    httpMock.verify();
  });

  it('polls health while offline alert is shown and hides on 200', fakeAsync(() => {
    store.overrideSelector(selectShowOfflineAlert, true);
    store.refreshState();
    tick(0);

    const req = httpMock.expectOne(api.health.check());
    expect(req.request.context.get(CONNECTIVITY_PROBE)).toBeTrue();
    req.flush({ server: 'healthy' });

    expect(store.dispatch).toHaveBeenCalledWith(hideOfflineAlert());
    simulateOfflineAlertCleared();
  }));

  it('hides offline alert when health returns 503 (server reachable)', fakeAsync(() => {
    store.overrideSelector(selectShowOfflineAlert, true);
    store.refreshState();
    tick(0);

    const req = httpMock.expectOne(api.health.check());
    req.flush(
      { server: 'healthy', s3: 'Connection failed' },
      { status: 503, statusText: 'Service Unavailable' },
    );

    expect(store.dispatch).toHaveBeenCalledWith(hideOfflineAlert());
    simulateOfflineAlertCleared();
  }));

  it('keeps polling after status 0 and does not hide', fakeAsync(() => {
    store.overrideSelector(selectShowOfflineAlert, true);
    store.refreshState();
    tick(0);

    const first = httpMock.expectOne(api.health.check());
    first.error(new ProgressEvent('error'), {
      status: 0,
      statusText: 'Unknown',
    });
    expect(store.dispatch).not.toHaveBeenCalledWith(hideOfflineAlert());

    tick(ConnectivityProbeService.INTERVAL_MS);
    const second = httpMock.expectOne(api.health.check());
    second.flush({ server: 'healthy' });
    expect(store.dispatch).toHaveBeenCalledWith(hideOfflineAlert());
    simulateOfflineAlertCleared();
  }));

  it('stops polling when offline alert is hidden', fakeAsync(() => {
    store.overrideSelector(selectShowOfflineAlert, true);
    store.refreshState();
    tick(0);
    httpMock.expectOne(api.health.check()).flush({ server: 'healthy' });

    simulateOfflineAlertCleared();
    tick(ConnectivityProbeService.INTERVAL_MS * 2);
    httpMock.expectNone(api.health.check());
    expect(true).toBeTrue();
  }));
});
