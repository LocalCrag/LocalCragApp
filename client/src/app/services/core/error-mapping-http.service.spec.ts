import {TestBed} from '@angular/core/testing';

import {ErrorMappingHttpService} from './error-mapping-http.service';

describe('ErrorMappingHttpService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ErrorMappingHttpService = TestBed.inject(ErrorMappingHttpService);
    expect(service).toBeTruthy();
  });
});
