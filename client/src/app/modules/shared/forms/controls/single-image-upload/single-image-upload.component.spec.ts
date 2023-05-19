import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleImageUploadComponent } from './single-image-upload.component';

describe('SingleImageUploadComponent', () => {
  let component: SingleImageUploadComponent;
  let fixture: ComponentFixture<SingleImageUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SingleImageUploadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleImageUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
