import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionFormComponent } from './region-form.component';

describe('RegionFormComponent', () => {
  let component: RegionFormComponent;
  let fixture: ComponentFixture<RegionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegionFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
