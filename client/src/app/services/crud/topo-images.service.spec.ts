import { TestBed } from '@angular/core/testing';

import { TopoImagesService } from './topo-images.service';

describe('TopoImagesService', () => {
  let service: TopoImagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopoImagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
