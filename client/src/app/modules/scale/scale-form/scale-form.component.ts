import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ScalesService } from '../../../services/crud/scales.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';
import { ActivatedRoute, Router } from '@angular/router';
import { LineType } from '../../../enums/line-type';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { Select } from 'primeng/select';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormEntryRowComponent } from '../../shared/components/form-entry-row/form-entry-row.component';
import { NgxColorsModule } from 'ngx-colors';
import {
  DEFAULT_STACKED_CHART_BRACKET_COLORS,
  normalizeStackedChartBracket,
} from '../../../utility/scale/stacked-chart-brackets';

@Component({
  selector: 'lc-scale-form',
  templateUrl: './scale-form.component.html',
  styleUrl: './scale-form.component.scss',
  imports: [
    TranslocoDirective,
    CardModule,
    ReactiveFormsModule,
    TranslocoPipe,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    FormsModule,
    ConfirmPopupModule,
    MessageModule,
    DividerModule,
    Select,
    TranslateSpecialGradesPipe,
    FormControlDirective,
    IfErrorDirective,
    ControlGroupDirective,
    FormDirective,
    FormEntryRowComponent,
    NgxColorsModule,
  ],
  providers: [ConfirmationService],
})
export class ScaleFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public scaleForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public scale: Scale;
  public editMode = true;

  private fb = inject(FormBuilder);
  private scalesService = inject(ScalesService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private route = inject(ActivatedRoute);
  protected router = inject(Router);
  private store = inject(Store);

  ngOnInit() {
    const lineType = this.route.snapshot.paramMap.get('lineType') as LineType;
    const name = this.route.snapshot.paramMap.get('name');

    if (!lineType) {
      this.editMode = false;
    }

    this.buildForm();
    this.scaleForm.disable();
    if (this.editMode) {
      this.scalesService
        .getScale(lineType, name)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        )
        .subscribe((scale) => {
          this.scale = scale;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        });
    } else {
      this.setFormValue();
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  buildForm() {
    const notUniqueValidator: ValidatorFn = (
      ctl: AbstractControl,
    ): ValidationErrors | null => {
      const formArray = ctl as FormArray;
      return formArray.value.length ===
        new Set(formArray.value.map((v: any) => v.value)).size
        ? null
        : { not_unique: true };
    };

    const semanticBracketErrorValidator: ValidatorFn = (
      ctl: AbstractControl,
    ): ValidationErrors | null => {
      const formArray = ctl as FormArray;
      return formArray.value.length >= 2 &&
        formArray.value.reduce(
          (p: boolean, c: any) => p && c.value > 0,
          true,
        ) &&
        formArray.value.at(-2).value + 1 === formArray.value.at(-1).value
        ? null
        : { semantic_error: true };
    };

    const minLengthValidator = (min: number): ValidatorFn => {
      return (ctl: AbstractControl): ValidationErrors | null => {
        const formArray = ctl as FormArray;
        return formArray.value.length >= min ? null : { invalid_length: true };
      };
    };

    this.scaleForm = this.fb.group({
      lineType: this.editMode ? undefined : [null, Validators.required],
      name: this.editMode
        ? undefined
        : ['', [Validators.required, Validators.maxLength(32)]],
      grades: this.fb.array([], [notUniqueValidator]),
      stackedChartBrackets: this.fb.array(
        [],
        [
          notUniqueValidator,
          semanticBracketErrorValidator,
          minLengthValidator(2),
        ],
      ),
      barChartBrackets: this.fb.array(
        [],
        [
          notUniqueValidator,
          semanticBracketErrorValidator,
          minLengthValidator(2),
        ],
      ),
    });
  }

  setFormValue() {
    if (this.editMode) {
      this.scale.grades
        .map((g) => this.createGradeGroup(g.name, g.value))
        .forEach((ctl) => this.gradeControls().push(ctl));
      this.scale.gradeBrackets.stackedChartBrackets
        .map((value, index) =>
          this.createStackedChartBracketGroup(
            normalizeStackedChartBracket(value, index),
          ),
        )
        .forEach((ctl) => this.stackedChartBracketsControls().push(ctl));
      this.scale.gradeBrackets.barChartBrackets
        .map((bracket) =>
          this.createBarChartBracketGroup(bracket.value, bracket.name),
        )
        .forEach((ctl) => this.barChartBracketsControls().push(ctl));
    } else {
      this.gradeControls().push(
        this.createGradeGroup(marker('CLOSED_PROJECT'), -2, false),
      );
      this.gradeControls().push(
        this.createGradeGroup(marker('OPEN_PROJECT'), -1, false),
      );
      this.gradeControls().push(
        this.createGradeGroup(marker('UNGRADED'), 0, false),
      );
      this.stackedChartBracketsControls().push(
        this.createStackedChartBracketGroup({
          value: 1,
          color: DEFAULT_STACKED_CHART_BRACKET_COLORS[0],
        }),
      );
      this.stackedChartBracketsControls().push(
        this.createStackedChartBracketGroup({
          value: 2,
          color: DEFAULT_STACKED_CHART_BRACKET_COLORS[1],
        }),
      );
      this.barChartBracketsControls().push(
        this.createBarChartBracketGroup(1, ''),
      );
      this.barChartBracketsControls().push(
        this.createBarChartBracketGroup(2, ''),
      );
      this.addGrade();
    }
    this.scaleForm.enable();
  }

  private isSpecialGrade(name: string, value: number): boolean {
    return (
      value <= 0 &&
      ['CLOSED_PROJECT', 'OPEN_PROJECT', 'UNGRADED'].includes(name)
    );
  }

  private createGradeGroup(
    name: string,
    value: number,
    validated?: boolean,
  ): FormGroup {
    const requireValidation = validated ?? !this.isSpecialGrade(name, value);
    const validators = requireValidation ? [Validators.required] : [];
    return this.fb.group({
      name: [name, validators],
      value: [value, validators],
    });
  }

  private createStackedChartBracketGroup(bracket: {
    value: number;
    color: string;
  }): FormGroup {
    return this.fb.group({
      value: [bracket.value, Validators.required],
      color: [bracket.color, Validators.required],
    });
  }

  private createBarChartBracketGroup(value: number, name: string): FormGroup {
    return this.fb.group({
      value: [value, Validators.required],
      name: [name, Validators.required],
    });
  }

  gradeControls() {
    return this.scaleForm.controls.grades as FormArray;
  }

  stackedChartBracketsControls() {
    return this.scaleForm.controls.stackedChartBrackets as FormArray;
  }

  barChartBracketsControls() {
    return this.scaleForm.controls.barChartBrackets as FormArray;
  }

  private reorderControlsByValue(
    controls: FormArray,
    includeName: boolean = true,
  ) {
    const data = controls.value;
    data.sort((a, b) => a.value - b.value);
    controls.clear();
    data
      .filter((g) => Number.isInteger(g.value))
      .map((g) => {
        if (includeName) {
          return this.createBarChartBracketGroup(g.value, g.name);
        }
        return this.createStackedChartBracketGroup({
          value: g.value,
          color: g.color,
        });
      })
      .forEach((ctl) => controls.push(ctl));
  }

  reorderGradesByValue() {
    const data = this.gradeControls().value;
    data.sort((a, b) => a.value - b.value);
    this.gradeControls().clear();
    data
      .filter((g) => Number.isInteger(g.value))
      .map((g) => this.createGradeGroup(g.name, g.value))
      .forEach((ctl) => this.gradeControls().push(ctl));
  }

  reorderBarChartBracketsByValue() {
    this.reorderControlsByValue(this.barChartBracketsControls());
  }

  reorderStackedChartBracketsByValue() {
    this.reorderControlsByValue(this.stackedChartBracketsControls(), false);
  }

  addGrade() {
    const max = this.gradeControls().value.reduce(
      (acc, v) => (v.value > acc ? v.value : acc),
      0,
    );
    this.gradeControls().push(this.createGradeGroup('', max + 1));
  }

  deleteGrade(index: number) {
    this.gradeControls().removeAt(index);
  }

  private addBracket(controls: FormArray, includeName: boolean = true) {
    const max = controls.value.reduce(
      (acc, v) => (v.value > acc ? v.value : acc),
      0,
    );
    if (includeName) {
      controls.push(this.createBarChartBracketGroup(max + 1, ''));
    } else {
      controls.push(
        this.createStackedChartBracketGroup({
          value: max + 1,
          color:
            DEFAULT_STACKED_CHART_BRACKET_COLORS[
              controls.value.length %
                DEFAULT_STACKED_CHART_BRACKET_COLORS.length
            ],
        }),
      );
    }
  }

  addStackedChartBracket() {
    this.addBracket(this.stackedChartBracketsControls(), false);
  }

  addBarChartBracket() {
    this.addBracket(this.barChartBracketsControls());
  }

  deleteStackedChartBracket(index: number) {
    this.stackedChartBracketsControls().removeAt(index);
  }

  deleteBarChartBracket(index: number) {
    this.barChartBracketsControls().removeAt(index);
  }

  saveScale() {
    if (!this.scaleForm.valid) {
      this.formDirective.markAsTouched();
      return;
    }

    this.loadingState = LoadingState.LOADING;
    this.scaleForm.disable();

    if (this.editMode) {
      this.scale.grades = this.gradeControls().value;
      this.scale.gradeBrackets = {
        stackedChartBrackets: this.stackedChartBracketsControls().value.map(
          (gb) => ({
            value: gb.value,
            color: gb.color,
          }),
        ),
        barChartBrackets: this.barChartBracketsControls().value.map((gb) => {
          return {
            value: gb.value,
            name: gb.name,
          };
        }),
      };
      this.scalesService.updateScale(this.scale).subscribe({
        next: () => {
          this.store.dispatch(toastNotification('SCALE_UPDATED'));
          this.loadingState = LoadingState.DEFAULT;
          this.scaleForm.enable();
        },
        error: () => {
          this.store.dispatch(toastNotification('SCALE_UPDATED_ERROR'));
          this.loadingState = LoadingState.DEFAULT;
          this.scaleForm.enable();
        },
      });
    } else {
      const scale = new Scale();
      scale.lineType = this.scaleForm.get('lineType').value;
      scale.name = this.scaleForm.get('name').value;
      scale.grades = this.gradeControls().value;
      scale.gradeBrackets = {
        stackedChartBrackets: this.stackedChartBracketsControls().value.map(
          (gb) => ({
            value: gb.value,
            color: gb.color,
          }),
        ),
        barChartBrackets: this.barChartBracketsControls().value.map((gb) => {
          return {
            value: gb.value,
            name: gb.name,
          };
        }),
      };
      this.scalesService.createScale(scale).subscribe({
        next: () => {
          this.store.dispatch(toastNotification('SCALE_CREATED'));
          this.loadingState = LoadingState.DEFAULT;
          this.scaleForm.enable();
          this.router.navigate(['/scales']);
        },
        error: () => {
          this.store.dispatch(toastNotification('SCALE_CREATED_ERROR'));
          this.loadingState = LoadingState.DEFAULT;
          this.scaleForm.enable();
        },
      });
    }
  }

  confirmDeleteScale(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('scale.scaleForm.confirmDeleteMessage'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('scale.scaleForm.acceptConfirmDelete'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('scale.scaleForm.cancel'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: this.deleteScale.bind(this),
    });
  }

  deleteScale() {
    this.loadingState = LoadingState.LOADING;
    this.scalesService.deleteScale(this.scale).subscribe({
      next: () => {
        this.router.navigate(['/scales']);
        this.store.dispatch(toastNotification('SCALE_DELETED'));
        this.loadingState = LoadingState.DEFAULT;
      },
      error: () => {
        this.store.dispatch(toastNotification('SCALE_DELETED_ERROR'));
        this.loadingState = LoadingState.DEFAULT;
      },
    });
  }

  protected readonly LoadingState = LoadingState;
  protected readonly LineType = LineType;
  protected readonly stackedChartBracketColors =
    DEFAULT_STACKED_CHART_BRACKET_COLORS;
}
