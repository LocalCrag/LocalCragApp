import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectorRulesComponent } from './sector-rules.component';

describe('SectorRulesComponent', () => {
  let component: SectorRulesComponent;
  let fixture: ComponentFixture<SectorRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectorRulesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SectorRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
