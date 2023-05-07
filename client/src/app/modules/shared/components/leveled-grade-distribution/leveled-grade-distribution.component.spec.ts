import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeveledGradeDistributionComponent } from './leveled-grade-distribution.component';

describe('LeveledGradeDistributionComponent', () => {
  let component: LeveledGradeDistributionComponent;
  let fixture: ComponentFixture<LeveledGradeDistributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeveledGradeDistributionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeveledGradeDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
