import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
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
import { NgForOf, NgIf } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { Store } from '@ngrx/store';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';

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
    FormsModule,
    ConfirmPopupModule,
    DropdownModule,
    MessageModule,
  ],
  providers: [ConfirmationService],
})
@UntilDestroy()
export class ScaleFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public scaleForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public scale: Scale;
  public editMode = true;

  constructor(
    private fb: FormBuilder,
    private scalesService: ScalesService,
    private confirmationService: ConfirmationService,
    private translocoService: TranslocoService,
    private route: ActivatedRoute,
    protected router: Router,
    private store: Store,
  ) {}

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
    const allNamesFilled: ValidatorFn = (
      control: AbstractControl,
    ): ValidationErrors | null => {
      const formArray = control as FormArray;
      return formArray.value.every(
        (item: any) => item.name && item.name.trim() !== '',
      )
        ? null
        : { names_not_filled: true };
    };

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

    const invalidLengthValidator = (min: number, max: number): ValidatorFn => {
      return (ctl: AbstractControl): ValidationErrors | null => {
        const formArray = ctl as FormArray;
        return formArray.value.length >= min && formArray.value.length <= max
          ? null
          : { invalid_length: true };
      };
    };

    this.scaleForm = this.fb.group({
      lineType: this.editMode
        ? undefined
        : [LineType.BOULDER, [Validators.required]],
      name: this.editMode ? undefined : ['', Validators.required],
      grades: this.fb.array([], [notUniqueValidator, allNamesFilled]),
      stackedChartBrackets: this.fb.array(
        [],
        [
          notUniqueValidator,
          semanticBracketErrorValidator,
          invalidLengthValidator(2, 8),
        ],
      ),
      barChartBrackets: this.fb.array(
        [],
        [
          notUniqueValidator,
          semanticBracketErrorValidator,
          invalidLengthValidator(2, 14),
          allNamesFilled,
        ],
      ),
    });
  }

  setFormValue() {
    if (this.editMode) {
      this.scale.grades
        .map((g) =>
          this.fb.group({
            name: [g.name],
            value: [g.value],
          }),
        )
        .forEach((ctl) => this.gradeControls().push(ctl));
      this.scale.gradeBrackets.stackedChartBrackets
        .map((value) =>
          this.fb.group({
            value: [value],
          }),
        )
        .forEach((ctl) => this.stackedChartBracketsControls().push(ctl));
      this.scale.gradeBrackets.barChartBrackets
        .map((bracket) =>
          this.fb.group({
            value: [bracket.value],
            name: [bracket.name],
          }),
        )
        .forEach((ctl) => this.barChartBracketsControls().push(ctl));
    } else {
      this.gradeControls().push(
        this.fb.group({ name: marker('CLOSED_PROJECT'), value: -2 }),
      );
      this.gradeControls().push(
        this.fb.group({ name: marker('OPEN_PROJECT'), value: -1 }),
      );
      this.gradeControls().push(
        this.fb.group({ name: marker('UNGRADED'), value: 0 }),
      );
      this.stackedChartBracketsControls().push(this.fb.group({ value: 1 }));
      this.stackedChartBracketsControls().push(this.fb.group({ value: 2 }));
      this.barChartBracketsControls().push(
        this.fb.group({ value: 1, name: marker('FIRST_BAR_CHART_BRACKET') }),
      );
      this.barChartBracketsControls().push(
        this.fb.group({ value: 2, name: marker('SECOND_BAR_CHART_BRACKET') }),
      );
      this.addGrade();
    }
    this.scaleForm.enable();
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
        const controls = {
          value: [g.value],
        };
        if (includeName) {
          controls['name'] = [g.name];
        }
        return this.fb.group(controls);
      })
      .forEach((ctl) => controls.push(ctl));
  }

  reorderGradesByValue() {
    this.reorderControlsByValue(this.gradeControls());
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
    this.gradeControls().push(this.fb.group({ name: [], value: [max + 1] }));
  }

  deleteGrade(index: number) {
    this.gradeControls().removeAt(index);
  }

  private addBracket(controls: FormArray, includeName: boolean = true) {
    const max = controls.value.reduce(
      (acc, v) => (v.value > acc ? v.value : acc),
      0,
    );
    const group = {
      value: [max + 1],
    };
    if (includeName) {
      group['name'] = [];
    }
    controls.push(this.fb.group(group));
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
    if (this.scaleForm.valid) {
      this.loadingState = LoadingState.LOADING;
      this.scaleForm.disable();

      if (this.editMode) {
        this.scale.grades = this.gradeControls().value;
        this.scale.gradeBrackets = {
          stackedChartBrackets: this.stackedChartBracketsControls().value.map(
            (gb) => gb.value,
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
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_UPDATED),
            );
            this.loadingState = LoadingState.DEFAULT;
            this.scaleForm.enable();
          },
          error: () => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_UPDATED_ERROR),
            );
            this.loadingState = LoadingState.DEFAULT;
            this.scaleForm.enable();
          },
        });
      } else {
        const scale = new Scale();
        scale.lineType = this.scaleForm.get('lineType').value.value;
        scale.name = this.scaleForm.get('name').value;
        scale.grades = this.gradeControls().value;
        scale.gradeBrackets = this.stackedChartBracketsControls().value.map(
          (gb) => gb.value,
        );
        this.scalesService.createScale(scale).subscribe({
          next: () => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_CREATED),
            );
            this.loadingState = LoadingState.DEFAULT;
            this.scaleForm.enable();
            this.router.navigate(['/scales']);
          },
          error: () => {
            this.store.dispatch(
              toastNotification(NotificationIdentifier.SCALE_CREATED_ERROR),
            );
            this.loadingState = LoadingState.DEFAULT;
            this.scaleForm.enable();
          },
        });
      }
    }
  }

  confirmDeleteScale(event: Event) {
    this.translocoService.load(environment.language).subscribe(() => {
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
    });
  }

  deleteScale() {
    this.loadingState = LoadingState.LOADING;
    this.scalesService.deleteScale(this.scale).subscribe({
      next: () => {
        this.router.navigate(['/scales']);
        this.store.dispatch(
          toastNotification(NotificationIdentifier.SCALE_DELETED),
        );
        this.loadingState = LoadingState.DEFAULT;
      },
      error: () => {
        this.store.dispatch(
          toastNotification(NotificationIdentifier.SCALE_DELETED_ERROR),
        );
        this.loadingState = LoadingState.DEFAULT;
      },
    });
  }

  protected readonly LoadingState = LoadingState;
  protected readonly LineType = LineType;
}
