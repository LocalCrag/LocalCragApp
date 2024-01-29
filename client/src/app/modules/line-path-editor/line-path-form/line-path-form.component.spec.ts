import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinePathFormComponent } from './line-path-form.component';

describe('LinePathFormComponent', () => {
  let component: LinePathFormComponent;
  let fixture: ComponentFixture<LinePathFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinePathFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinePathFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
