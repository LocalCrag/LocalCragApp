import {TestBed} from '@angular/core/testing';

import {HttpBackendClientService} from './http-backend-client.service';

describe('HttpBackendClientService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HttpBackendClientService = TestBed.inject(HttpBackendClientService);
    expect(service).toBeTruthy();
  });
});
