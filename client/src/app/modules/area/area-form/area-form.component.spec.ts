import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaFormComponent } from './area-form.component';

describe('AreaFormComponent', () => {
  let component: AreaFormComponent;
  let fixture: ComponentFixture<AreaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AreaFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AreaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
