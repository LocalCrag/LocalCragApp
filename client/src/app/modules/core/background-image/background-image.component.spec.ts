import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundImageComponent } from './background-image.component';

describe('BackgroundImageComponent', () => {
  let component: BackgroundImageComponent;
  let fixture: ComponentFixture<BackgroundImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackgroundImageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BackgroundImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
