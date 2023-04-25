import {TestBed} from '@angular/core/testing';

import {AppNotificationsService} from './app-notifications.service';

describe('AppNotificationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AppNotificationsService = TestBed.inject(AppNotificationsService);
    expect(service).toBeTruthy();
  });
});
