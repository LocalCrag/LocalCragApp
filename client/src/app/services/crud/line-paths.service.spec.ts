import { TestBed } from '@angular/core/testing';

import { LinePathsService } from './line-paths.service';

describe('LinePathsService', () => {
  let service: LinePathsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinePathsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
