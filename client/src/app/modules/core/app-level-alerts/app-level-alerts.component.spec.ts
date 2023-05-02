import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLevelAlertsComponent } from './app-level-alerts.component';

describe('AppLevelAlertsComponent', () => {
  let component: AppLevelAlertsComponent;
  let fixture: ComponentFixture<AppLevelAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppLevelAlertsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppLevelAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
