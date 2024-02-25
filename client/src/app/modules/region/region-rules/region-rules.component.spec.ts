import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionRulesComponent } from './region-rules.component';

describe('RegionRulesComponent', () => {
  let component: RegionRulesComponent;
  let fixture: ComponentFixture<RegionRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionRulesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegionRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
