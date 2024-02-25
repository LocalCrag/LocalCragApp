import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionInfoComponent } from './region-info.component';

describe('RegionInfoComponent', () => {
  let component: RegionInfoComponent;
  let fixture: ComponentFixture<RegionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
