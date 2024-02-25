import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CragRulesComponent } from './crag-rules.component';

describe('CragRulesComponent', () => {
  let component: CragRulesComponent;
  let fixture: ComponentFixture<CragRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CragRulesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CragRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
