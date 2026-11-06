import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ControlGroupDirective } from './control-group.directive';
import { FormArrayDirective } from './form-array.directive';
import { FormControlDirective } from './form-control.directive';
import { FormDirective } from './form.directive';
import { IfErrorDirective } from './if-error.directive';

function notUnique(control: AbstractControl): ValidationErrors | null {
  const values = control.value as unknown[];
  return new Set(values).size === values.length ? null : { not_unique: true };
}

function minCount(min: number) {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value.length >= min ? null : { invalid_length: true };
}

@Component({
  imports: [
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormArrayDirective,
    IfErrorDirective,
  ],
  template: `
    <form [formGroup]="form" lcForm>
      <div lcControlGroup>
        <ng-container formArrayName="grades" lcFormArray>
          <span class="not-unique" *lcIfError="'not_unique'">duplicate</span>
          <span class="too-short" *lcIfError="'invalid_length'">too short</span>
        </ng-container>
      </div>
    </form>
  `,
})
class ArrayHostComponent {
  @ViewChild(FormDirective) formDirective: FormDirective;

  readonly form = new FormGroup({
    grades: new FormArray(
      [new FormControl('a'), new FormControl('a')],
      [notUnique, minCount(2)],
    ),
  });
}

@Component({
  imports: [
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  template: `
    <form [formGroup]="form" lcForm>
      <div lcControlGroup>
        <input formControlName="name" lcFormControl />
        <span class="required" *lcIfError="'required'">required</span>
      </div>
    </form>
  `,
})
class ControlHostComponent {
  readonly form = new FormGroup({
    name: new FormControl('', Validators.required),
  });
}

describe('lcFormArray', () => {
  let fixture: ComponentFixture<ArrayHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArrayHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ArrayHostComponent);
    fixture.detectChanges();
  });

  it('shows an array error as soon as it is present', () => {
    expect(fixture.nativeElement.querySelector('.not-unique')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.too-short')).toBeNull();
  });

  it('hides the error when the array becomes valid and shows it again when it does not', () => {
    fixture.componentInstance.form.controls.grades.setValue(['a', 'b']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.not-unique')).toBeNull();

    fixture.componentInstance.form.controls.grades.setValue(['b', 'b']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.not-unique')).not.toBeNull();
  });

  it('shows a length error after a row is removed', () => {
    fixture.componentInstance.form.controls.grades.setValue(['a', 'b']);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.grades.removeAt(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.too-short')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.not-unique')).toBeNull();
  });

  it('marks the form array touched when the form is marked touched', () => {
    fixture.componentInstance.formDirective.markAsTouched();

    expect(fixture.componentInstance.form.controls.grades.touched).toBeTrue();
    expect(fixture.nativeElement.querySelector('.not-unique')).not.toBeNull();
  });
});

@Component({
  imports: [
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormArrayDirective,
    IfErrorDirective,
  ],
  template: `
    <form [formGroup]="form" lcForm>
      <div formArrayName="grades">
        <div lcControlGroup>
          <ng-container lcFormArray>
            <span class="nested-error" *lcIfError="'not_unique'"
              >duplicate</span
            >
          </ng-container>
        </div>
      </div>
    </form>
  `,
})
class NestedArrayHostComponent {
  readonly form = new FormGroup({
    grades: new FormArray(
      [new FormControl('a'), new FormControl('a')],
      notUnique,
    ),
  });
}

describe('lcFormArray inside an ancestor formArrayName', () => {
  it('shows the array error', () => {
    TestBed.configureTestingModule({
      imports: [NestedArrayHostComponent],
    });
    const fixture = TestBed.createComponent(NestedArrayHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.nested-error')).not.toBeNull();
  });
});

describe('lcFormControl', () => {
  it('still waits for blur before showing a control error', () => {
    TestBed.configureTestingModule({
      imports: [ControlHostComponent],
    });
    const fixture = TestBed.createComponent(ControlHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.required')).toBeNull();

    fixture.nativeElement
      .querySelector('input')
      .dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.required')).not.toBeNull();
  });
});
