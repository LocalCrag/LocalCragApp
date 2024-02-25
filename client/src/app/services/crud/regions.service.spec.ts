import { TestBed } from '@angular/core/testing';

import { RegionsService } from './regions.service';

describe('RegionsService', () => {
  let service: RegionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
