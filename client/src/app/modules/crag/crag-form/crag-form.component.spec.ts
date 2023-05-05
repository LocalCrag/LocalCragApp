import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CragFormComponent } from './crag-form.component';

describe('CragFormComponent', () => {
  let component: CragFormComponent;
  let fixture: ComponentFixture<CragFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CragFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CragFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
