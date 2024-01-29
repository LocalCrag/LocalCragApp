import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopoImageListComponent } from './topo-image-list.component';

describe('TopoImageListComponent', () => {
  let component: TopoImageListComponent;
  let fixture: ComponentFixture<TopoImageListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopoImageListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopoImageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
