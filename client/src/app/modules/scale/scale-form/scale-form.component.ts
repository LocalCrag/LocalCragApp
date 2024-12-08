import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';
import { ActivatedRoute, Router } from '@angular/router';
import { LineType } from '../../../enums/line-type';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgForOf, NgIf } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lc-scale-form',
  standalone: true,
  templateUrl: './scale-form.component.html',
  styleUrl: './scale-form.component.scss',
  imports: [
    TranslocoDirective,
    CardModule,
    ReactiveFormsModule,
    NgForOf,
    SharedModule,
    TranslocoPipe,
    NgIf,
    InputTextModule,
    InputNumberModule,
    ToolbarModule,
    ButtonModule,
    FormsModule
  ]
})
@UntilDestroy()
export class ScaleFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public scaleForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public scale: Scale;

  constructor(
    private fb: FormBuilder,
    private scalesService: ScalesService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    const lineType = this.route.snapshot.paramMap.get('lineType') as LineType;
    const name = this.route.snapshot.paramMap.get('name');

    this.buildForm();
    this.scaleForm.disable();
    this.scalesService.getScale(lineType, name).pipe(catchError((e) => {
      if (e.status === 404) {
        this.router.navigate(['/not-found']);
      }
      return of(e);
    })).subscribe((scale) => {
      this.scale = scale;
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  buildForm() {
    this.scaleForm = this.fb.group({
      grades: this.fb.array([]),
    });
  }

  setFormValue() {
    this.scale.grades.map((g) => this.fb.group({
      name: [g.name],
      value: [g.value],
    })).forEach((ctl) => this.gradeControls().push(ctl));
    this.scaleForm.enable();
  }

  gradeControls() {
    return this.scaleForm.controls.grades as FormArray;
  }

  reorderByValue() {
    this.scaleForm.disable();
    const data = this.gradeControls().value;
    data.sort((a, b) => a.value - b.value);
    this.gradeControls().clear();
    data.filter((g) => Number.isInteger(g.value)).map((g) => this.fb.group({
      name: [g.name],
      value: [g.value],
    })).forEach((ctl) => this.gradeControls().push(ctl));
    this.scaleForm.enable();
  }

  addGrade() {
    this.gradeControls().push(this.fb.group({name: [], value: [42]}));
  }

  deleteValue(index: number) {
    this.scaleForm.disable();
    this.gradeControls().removeAt(index);
    this.scaleForm.enable();
  }

  saveScale() {
    // todo
  }

  deleteScale() {
    // todo
  }

  protected readonly LoadingState = LoadingState;
}
