import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineListComponent } from './line-list.component';

describe('LineListComponent', () => {
  let component: LineListComponent;
  let fixture: ComponentFixture<LineListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LineListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
