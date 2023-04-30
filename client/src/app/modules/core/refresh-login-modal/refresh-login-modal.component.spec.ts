import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefreshLoginModalComponent } from './refresh-login-modal.component';

describe('RefreshLoginModalComponent', () => {
  let component: RefreshLoginModalComponent;
  let fixture: ComponentFixture<RefreshLoginModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RefreshLoginModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefreshLoginModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
