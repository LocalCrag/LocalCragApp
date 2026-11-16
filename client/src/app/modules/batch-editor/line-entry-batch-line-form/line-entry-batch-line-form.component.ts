import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validator,
  Validators,
  AbstractControl,
  ValidationErrors,
  TouchedChangeEvent,
} from '@angular/forms';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { Line } from '../../../models/line';
import { StartingPosition } from '../../../enums/starting-position';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { defaultScaleName, Grade, Scale } from '../../../models/scale';
import { LineType } from '../../../enums/line-type';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { AreasService } from '../../../services/crud/areas.service';
import { ClosureStateService } from '../../../services/crud/closure-state.service';
import { ScalesService } from '../../../services/crud/scales.service';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { LanguageService } from '../../../services/core/language.service';
import {
  selectGymMode,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { AdvancedColorPickerComponent } from '../../shared/forms/controls/advanced-color-picker/advanced-color-picker.component';
import { AsyncPipe } from '@angular/common';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';

@Component({
  selector: 'lc-line-entry-batch-line-form',
  imports: [
    ControlGroupDirective,
    FormControlDirective,
    FormDirective,
    FormsModule,
    IfErrorDirective,
    ReactiveFormsModule,
    TranslocoDirective,
    AdvancedColorPickerComponent,
    TranslateSpecialGradesPipe,
    TranslocoPipe,
    AsyncPipe,
    HlmButton,
    HlmInput,
    ...HlmSelectImports,
    HlmBadge,
    NgIcon,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LineEntryBatchLineFormComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => LineEntryBatchLineFormComponent),
      multi: true,
    },
    provideIcons({ lucideTrash2 }),
  ],
  templateUrl: './line-entry-batch-line-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './line-entry-batch-line-form.component.scss',
})
export class LineEntryBatchLineFormComponent
  implements ControlValueAccessor, Validator, OnInit, OnChanges
{
  @ViewChild(FormDirective) formDirective: FormDirective;

  @Input() index: number;
  @Input() grades: Grade[];
  @Input() type: LineType;
  @Input() deleteDisabled = true;
  @Input() control: AbstractControl;

  @Output() delete = new EventEmitter<null>();

  public lineForm: FormGroup;
  public lineTypes = LineType;
  public line: Line;
  public startingPositions = [
    StartingPosition.STAND,
    StartingPosition.SIT,
    StartingPosition.CROUCH,
    StartingPosition.LAYDOWN,
    StartingPosition.FRENCH,
    StartingPosition.CANDLE,
  ];
  public parentSecret = false;
  public parentClosed = false;
  public faFormat = FaDefaultFormat.YEAR;
  public groupedScales: Record<LineType, Scale[]> = null;
  public defaultScales: Record<LineType, string | null> = {
    [LineType.BOULDER]: null,
    [LineType.SPORT]: null,
    [LineType.TRAD]: null,
  };
  public typeOptions = null;

  private areaSlug: string;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private areasService = inject(AreasService);
  private translocoService = inject(TranslocoService);
  private translateSpecialGradesService = inject(TranslateSpecialGradesService);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);
  private scalesService = inject(ScalesService);
  private closureStateService = inject(ClosureStateService);

  private onChange: (value: Line) => void = () => {};
  private onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};

  public gymMode$ = this.store
    .select(selectGymMode)
    .pipe(takeUntilDestroyed(this.destroyRef));

  ngOnInit() {
    this.buildForm();

    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');

    forkJoin([
      this.areasService.getArea(this.areaSlug),
      this.closureStateService.getAreaClosureState(this.areaSlug),
      this.scalesService.getScales(),
    ]).subscribe(([area, parentClosureState, scales]) => {
      this.parentSecret = area.secret;
      this.parentClosed = parentClosureState.closed;

      this.groupedScales = {
        [LineType.BOULDER]: [],
        [LineType.SPORT]: [],
        [LineType.TRAD]: [],
      };
      scales
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((scale) => this.groupedScales[scale.lineType].push(scale));

      this.defaultScales[LineType.BOULDER] = defaultScaleName(
        scales,
        LineType.BOULDER,
      );
      this.defaultScales[LineType.SPORT] = defaultScaleName(
        scales,
        LineType.SPORT,
      );
      this.defaultScales[LineType.TRAD] = defaultScaleName(
        scales,
        LineType.TRAD,
      );

      this.buildTypeOptions();
      this.languageService.renderedLanguage$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((rendered) => {
          if (!rendered) return;
          this.buildTypeOptions();
        });
    });

    this.control.events.subscribe((event) => {
      if (event instanceof TouchedChangeEvent && event.touched) {
        this.markAsTouched();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['grades']) {
      this.lineForm?.get('grade').setValue(null);
    }
    if (changes['type'] && changes['type'].currentValue !== LineType.BOULDER) {
      this.lineForm?.get('startingPosition').setValue(StartingPosition.STAND);
    }
  }

  private buildForm() {
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.faFormat = instanceSettings.faDefaultFormat;

        this.lineForm = this.fb.group({
          name: ['', [Validators.required, Validators.maxLength(120)]],
          color: [
            instanceSettings.gymMode ? instanceSettings.arrowColor : null,
          ],
          grade: [null, [Validators.required]],
          faName: [null, [Validators.maxLength(120)]],
          startingPosition: [
            instanceSettings.defaultStartingPosition ?? StartingPosition.STAND,
            [Validators.required],
          ],
        });

        this.lineForm
          .get('grade')
          .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.setFaInputsDisabledState();
          });

        this.lineForm.valueChanges.subscribe(() => {
          this.onChange(this.lineForm.value as Line);
        });
      });
    this.lineForm.statusChanges.subscribe(() => {
      this.validatorChange();
    });
  }

  writeValue(obj: Line): void {
    if (obj) {
      this.lineForm.patchValue(obj);
      this.setFaInputsDisabledState();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  markAsTouched() {
    this.markAllTouched();
    this.onTouched();
  }

  private markAllTouched() {
    Object.values(this.lineForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.lineForm?.disable();
    } else {
      this.lineForm?.enable();
    }
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    if (!this.lineForm) return null;
    return this.lineForm.valid ? null : { lineInvalid: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }

  private setFaInputsDisabledState() {
    const gradeValue = this.lineForm?.get('grade')?.value;
    const faNameControl = this.lineForm?.get('faName');
    if (!faNameControl) {
      return;
    }
    if (gradeValue != null && gradeValue < 0) {
      faNameControl.disable();
      faNameControl.setValue(null);
    } else {
      faNameControl.enable();
    }
  }

  selectLabel = (value: unknown): string => {
    const grade = this.grades?.find((option) => option.value === value);
    if (grade?.name) {
      return this.translateSpecialGradesService.translate(grade.name);
    }
    return value == null ? '' : String(value);
  };

  private buildTypeOptions() {
    this.typeOptions = Object.entries(this.groupedScales)
      .filter(([_, v]) => v.length > 0)
      .map(([k]) => ({
        label: this.translocoService.translate(k),
        value: k,
      }));
  }
}
