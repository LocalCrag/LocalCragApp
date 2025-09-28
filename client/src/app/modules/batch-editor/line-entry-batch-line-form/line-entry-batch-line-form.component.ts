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
import { InputText } from 'primeng/inputtext';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { Line } from '../../../models/line';
import { StartingPosition } from '../../../enums/starting-position';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { Grade, Scale } from '../../../models/scale';
import { LineType } from '../../../enums/line-type';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { AreasService } from '../../../services/crud/areas.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { CragsService } from '../../../services/crud/crags.service';
import { ConfirmationService } from 'primeng/api';
import { ScalesService } from '../../../services/crud/scales.service';
import { forkJoin } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  selectGymMode,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { AdvancedColorPickerComponent } from '../../shared/forms/controls/advanced-color-picker/advanced-color-picker.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { Select } from 'primeng/select';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { ButtonDirective } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'lc-line-entry-batch-line-form',
  imports: [
    ControlGroupDirective,
    FormControlDirective,
    FormDirective,
    FormsModule,
    IfErrorDirective,
    InputText,
    ReactiveFormsModule,
    TranslocoDirective,
    AdvancedColorPickerComponent,
    Select,
    TranslateSpecialGradesPipe,
    TranslocoPipe,
    NgIf,
    Tag,
    ButtonDirective,
    AsyncPipe,
  ],
  providers: [
    ConfirmationService,
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
  ],
  templateUrl: './line-entry-batch-line-form.component.html',
  styleUrl: './line-entry-batch-line-form.component.scss',
})
@UntilDestroy()
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
  public gymMode$ = this.store.select(selectGymMode).pipe(untilDestroyed(this));

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;

  private onChange: (value: Line) => void = () => {};
  private onTouched: () => void = () => {};
  private validatorChange: () => void = () => {};

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private areasService: AreasService,
    private sectorsService: SectorsService,
    private cragsService: CragsService,
    private translocoService: TranslocoService,
    private scalesService: ScalesService,
  ) {}

  ngOnInit() {
    this.buildForm();

    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');

    forkJoin([
      this.cragsService.getCrag(this.cragSlug),
      this.sectorsService.getSector(this.sectorSlug),
      this.areasService.getArea(this.areaSlug),
      this.scalesService.getScales(),
    ]).subscribe(([crag, sector, area, scales]) => {
      this.parentSecret = area.secret;
      this.parentClosed = area.closed;

      this.groupedScales = {
        [LineType.BOULDER]: [],
        [LineType.SPORT]: [],
        [LineType.TRAD]: [],
      };
      scales
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((scale) => this.groupedScales[scale.lineType].push(scale));

      this.defaultScales[LineType.BOULDER] =
        area.defaultBoulderScale ??
        sector.defaultBoulderScale ??
        crag.defaultBoulderScale;
      this.defaultScales[LineType.SPORT] =
        area.defaultSportScale ??
        sector.defaultSportScale ??
        crag.defaultSportScale;
      this.defaultScales[LineType.TRAD] =
        area.defaultTradScale ??
        sector.defaultTradScale ??
        crag.defaultTradScale;

      this.typeOptions = Object.entries(this.groupedScales)
        .filter(([_, v]) => v.length > 0)
        .map(([k]) => ({
          label: this.translocoService.translate(k),
          value: k,
        }));
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
          startingPosition: [StartingPosition.STAND, [Validators.required]],
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
}
