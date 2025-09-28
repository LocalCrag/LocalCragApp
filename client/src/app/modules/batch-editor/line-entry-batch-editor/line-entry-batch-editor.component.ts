import { Component, OnInit, ViewChild } from '@angular/core';
import { Card } from 'primeng/card';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { select, Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import {
  selectGymMode,
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { MultiImageUploadComponent } from '../../shared/forms/controls/multi-image-upload/multi-image-upload.component';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import {
  Step,
  StepList,
  StepPanel,
  StepPanels,
  Stepper,
} from 'primeng/stepper';
import { LineEntryBatchLineFormComponent } from '../line-entry-batch-line-form/line-entry-batch-line-form.component';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { AreasService } from '../../../services/crud/areas.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { CragsService } from '../../../services/crud/crags.service';
import { ScalesService } from '../../../services/crud/scales.service';
import { Scale } from '../../../models/scale';
import { LineType } from '../../../enums/line-type';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DatePicker } from 'primeng/datepicker';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { dateNotInFutureValidator } from '../../../utility/validators/date-not-in-future.validator';
import { Message } from 'primeng/message';
import { map, take } from 'rxjs/operators';
import { BatchEditorService } from '../../../services/crud/batch-editor.service';
import { LinePathFormComponent } from '../../line-path-editor/line-path-form/line-path-form.component';
import { TopoImage } from '../../../models/topo-image';
import { Image } from 'primeng/image';

@Component({
  selector: 'lc-line-entry-batch-editor',
  imports: [
    Card,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    IfErrorDirective,
    TranslocoDirective,
    MultiImageUploadComponent,
    FormControlDirective,
    Stepper,
    StepList,
    Step,
    StepPanels,
    StepPanel,
    LineEntryBatchLineFormComponent,
    NgForOf,
    NgIf,
    Button,
    Select,
    DatePicker,
    AsyncPipe,
    Message,
    LinePathFormComponent,
    FormsModule,
    Image,
  ],
  templateUrl: './line-entry-batch-editor.component.html',
  styleUrl: './line-entry-batch-editor.component.scss',
})
@UntilDestroy()
export class LineEntryBatchEditorComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public topoImageBatchUploadForm: FormGroup;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public topoImages: TopoImage[] = [];

  public typeOptions = null;
  public scaleOptions = null;
  public grades = null;
  public faFormat = FaDefaultFormat.YEAR;
  public faFormats = FaDefaultFormat;

  public today = new Date(new Date().getFullYear(), 11, 31);
  public gymMode$ = this.store.select(selectGymMode).pipe(untilDestroyed(this));
  public currentStep = 2;

  public groupedScales: Record<LineType, Scale[]> = null;
  public defaultScales: Record<LineType, string | null> = {
    [LineType.BOULDER]: null,
    [LineType.SPORT]: null,
    [LineType.TRAD]: null,
  };

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private title: Title,
    private translocoService: TranslocoService,
    private router: Router,
    private areasService: AreasService,
    private sectorsService: SectorsService,
    private cragsService: CragsService,
    private scalesService: ScalesService,
    private batchEditorService: BatchEditorService,
  ) {}

  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');

    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('batchUploadTopoImageBrowserTitle'))} - ${instanceName}`,
      );
    });

    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.faFormat = instanceSettings.faDefaultFormat;
      });

    this.loadingState = LoadingState.DEFAULT;

    forkJoin([
      this.cragsService.getCrag(this.cragSlug),
      this.sectorsService.getSector(this.sectorSlug),
      this.areasService.getArea(this.areaSlug),
      this.scalesService.getScales(),
    ]).subscribe(([crag, sector, area, scales]) => {
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

      this.buildForm();
      this.topoImageBatchUploadForm
        .get('lines.type')
        .valueChanges.pipe(untilDestroyed(this))
        .subscribe((item) => {
          this.scaleOptions = this.groupedScales[item].map((scale) => ({
            label: scale.name,
            value: scale.name,
          }));
          this.topoImageBatchUploadForm
            .get('lines.scale')
            .setValue(this.defaultScales[item] ?? this.scaleOptions[0].value);
        });
      this.topoImageBatchUploadForm
        .get('lines.scale')
        .valueChanges.pipe(untilDestroyed(this))
        .subscribe((item) => {
          this.scalesService
            .getScale(
              this.topoImageBatchUploadForm.get('lines.type').value,
              item,
            )
            .subscribe((scale) => {
              this.grades = scale.grades;
            });
        });

      this.topoImageBatchUploadForm
        .get('lines.type')
        .setValue(LineType.BOULDER);
    });
  }

  private buildForm() {
    this.topoImageBatchUploadForm = this.fb.group({
      images: [[], [Validators.required]],
      lines: this.fb.group({
        lines: this.fb.array([this.fb.control(null)], [Validators.required]),
        type: [LineType.BOULDER, [Validators.required]],
        scale: [this.groupedScales[LineType.BOULDER][0], [Validators.required]],
        faDate: [null, [dateNotInFutureValidator()]],
      }),
      selectedTopoImage: [null],
    });
  }

  public validateCurrentStep() {
    if (this.currentStep === 1) {
      this.topoImageBatchUploadForm.get('images').markAsTouched();
    }
    if (this.currentStep === 2) {
      this.topoImageBatchUploadForm.get('lines').markAllAsTouched();
    }
  }

  get currentStepInvalid(): boolean {
    if (this.currentStep === 1) {
      return this.topoImageBatchUploadForm.get('images').invalid;
    }
    if (this.currentStep === 2) {
      return this.topoImageBatchUploadForm.get('lines').invalid;
    }
    if (this.currentStep === 3) {
      return false;
    }
    return false;
  }

  nextStep() {
    if (this.currentStepInvalid) {
      this.validateCurrentStep();
      return;
    }
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStepInvalid) {
      this.validateCurrentStep();
      return;
    }
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  get lines(): FormArray {
    return this.topoImageBatchUploadForm.get('lines.lines') as FormArray;
  }

  addLine() {
    this.lines.push(this.fb.control(null));
  }

  removeLine(index: number) {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  public getDisplayUserGrades() {
    return this.store.pipe(
      select(selectInstanceSettingsState),
      take(1),
      map((instanceSettings) => instanceSettings.displayUserGrades),
    );
  }

  cancel() {
    this.router.navigate([
      '/topo',
      this.cragSlug,
      this.sectorSlug,
      this.areaSlug,
      'topo-images',
    ]);
  }

  public saveLinesAndTopoImages() {
    if (this.topoImageBatchUploadForm.valid) {
      this.loadingState = LoadingState.LOADING;
      this.batchEditorService
        .batchCreateLines(
          {
            images: this.topoImageBatchUploadForm.value.images.map(
              (lineData) => lineData.id,
            ),
            gradeScale: this.topoImageBatchUploadForm.value.lines.scale,
            type: this.topoImageBatchUploadForm.value.lines.type,
            faDate: this.topoImageBatchUploadForm.value.lines.faDate
              ? this.topoImageBatchUploadForm.value.lines.faDate
                  .toISOString()
                  .split('T')[0]
              : null,
            lines: this.lines.value.map((lineData) => ({
              name: lineData.name,
              authorGradeValue: lineData.grade,
              color: lineData.color,
              faName: lineData.faName,
              startingPosition: lineData.startingPosition,
            })),
          },
          this.areaSlug,
        )
        .subscribe((result) => {
          this.loadingState = LoadingState.DEFAULT;
          this.topoImages = result.topoImages;
          if (this.topoImages.length > 0) {
            this.topoImageBatchUploadForm
              .get('selectedTopoImage')
              .setValue(this.topoImages[0]);
          }
          this.nextStep();
        });
    } else {
      this.validateCurrentStep();
    }
  }
}
