import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeDistributionBarChartComponent } from './grade-distribution-bar-chart.component';

describe('GradeDistributionBarChartComponent', () => {
  let component: GradeDistributionBarChartComponent;
  let fixture: ComponentFixture<GradeDistributionBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeDistributionBarChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GradeDistributionBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
