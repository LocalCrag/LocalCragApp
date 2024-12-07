import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';
import { ActivatedRoute, Router } from '@angular/router';
import { LineType } from '../../../enums/line-type';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgForOf } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

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
    SharedModule
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

}
