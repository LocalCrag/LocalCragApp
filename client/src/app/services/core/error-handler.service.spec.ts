import {TestBed} from '@angular/core/testing';

import {ErrorHandlerService} from './error-handler.service';

describe('ErrorHandlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ErrorHandlerService = TestBed.inject(ErrorHandlerService);
    expect(service).toBeTruthy();
  });
});
