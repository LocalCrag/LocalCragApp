import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopoImageComponent } from './topo-image.component';

describe('TopoImageComponent', () => {
  let component: TopoImageComponent;
  let fixture: ComponentFixture<TopoImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopoImageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopoImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
