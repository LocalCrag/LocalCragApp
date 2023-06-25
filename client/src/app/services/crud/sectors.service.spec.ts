import { TestBed } from '@angular/core/testing';

import { SectorsService } from './sectors.service';

describe('SectorsService', () => {
  let service: SectorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SectorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
