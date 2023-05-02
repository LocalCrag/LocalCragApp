import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataPrivacyStatementComponent } from './data-privacy-statement.component';

describe('DataPrivacyStatementComponent', () => {
  let component: DataPrivacyStatementComponent;
  let fixture: ComponentFixture<DataPrivacyStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataPrivacyStatementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataPrivacyStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
