import {TestBed} from '@angular/core/testing';

import {CragsService} from './crags.service';

describe('CragsService', () => {
  let service: CragsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CragsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
