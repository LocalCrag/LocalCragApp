import { TestBed } from '@angular/core/testing';

import { LinesService } from './lines.service';

describe('LinesService', () => {
  let service: LinesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
