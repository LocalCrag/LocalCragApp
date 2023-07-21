import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectorInfoComponent } from './sector-info.component';

describe('SectorInfoComponent', () => {
  let component: SectorInfoComponent;
  let fixture: ComponentFixture<SectorInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SectorInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectorInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
