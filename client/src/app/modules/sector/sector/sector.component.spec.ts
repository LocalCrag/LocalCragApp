import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectorComponent } from './sector.component';

describe('SectorComponent', () => {
  let component: SectorComponent;
  let fixture: ComponentFixture<SectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
