import { TestBed } from '@angular/core/testing';

import { ControlGroupService } from './control-group.service';

describe('ControlGroupService', () => {
  let service: ControlGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ControlGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
