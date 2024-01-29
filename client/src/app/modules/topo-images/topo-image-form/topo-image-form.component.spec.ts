import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopoImageFormComponent } from './topo-image-form.component';

describe('TopoImageFormComponent', () => {
  let component: TopoImageFormComponent;
  let fixture: ComponentFixture<TopoImageFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopoImageFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopoImageFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
