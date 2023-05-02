import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordCheckMailboxComponent } from './forgot-password-check-mailbox.component';

describe('ForgotPasswordCheckMailboxComponent', () => {
  let component: ForgotPasswordCheckMailboxComponent;
  let fixture: ComponentFixture<ForgotPasswordCheckMailboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForgotPasswordCheckMailboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordCheckMailboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
