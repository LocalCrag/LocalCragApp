import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinePathEditorComponent } from './line-path-editor.component';

describe('LinePathEditorComponent', () => {
  let component: LinePathEditorComponent;
  let fixture: ComponentFixture<LinePathEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinePathEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinePathEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
