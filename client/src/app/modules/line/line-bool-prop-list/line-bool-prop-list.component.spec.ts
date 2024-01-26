import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineBoolPropListComponent } from './line-bool-prop-list.component';

describe('LineBoolPropListComponent', () => {
  let component: LineBoolPropListComponent;
  let fixture: ComponentFixture<LineBoolPropListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineBoolPropListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineBoolPropListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
