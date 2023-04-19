import {TestBed} from '@angular/core/testing';

import {MeasurandsService} from './crags.service';

describe('MeasurandsService', () => {
  let service: MeasurandsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeasurandsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
