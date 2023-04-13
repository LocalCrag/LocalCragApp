import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionsListComponent } from './actions-list.component';

describe('ActionsListComponent', () => {
  let component: ActionsListComponent;
  let fixture: ComponentFixture<ActionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActionsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
