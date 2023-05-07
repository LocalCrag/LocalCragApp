import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CragListComponent } from './crag-list.component';

describe('CragListComponent', () => {
  let component: CragListComponent;
  let fixture: ComponentFixture<CragListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CragListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CragListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
