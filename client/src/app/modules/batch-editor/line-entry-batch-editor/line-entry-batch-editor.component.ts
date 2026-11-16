import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
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
import {
  selectGymMode,
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { MultiImageUploadComponent } from '../../shared/forms/controls/multi-image-upload/multi-image-upload.component';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { LineEntryBatchLineFormComponent } from '../line-entry-batch-line-form/line-entry-batch-line-form.component';
import { AsyncPipe } from '@angular/common';
import { ScalesService } from '../../../services/crud/scales.service';
import { defaultScaleName, Scale } from '../../../models/scale';
import { LineType } from '../../../enums/line-type';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { dateNotInFutureValidator } from '../../../utility/validators/date-not-in-future.validator';
import { map, take } from 'rxjs/operators';
import { BatchEditorService } from '../../../services/crud/batch-editor.service';
import { LinePathFormComponent } from '../../line-path-editor/line-path-form/line-path-form.component';
import { TopoImage } from '../../../models/topo-image';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../../services/core/language.service';
import { PageTitleService } from '../../../services/core/page-title.service';
import { filterSelectableGrades } from '../../../utility/grade/filter-selectable-grades';
import { Grade } from '../../../models/scale';
import { HlmButton } from '@spartan-ng/helm/button';
import { SpartanStepper, SpartanStepperImports } from '../../../ui/stepper/src';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideArrowRight,
  lucideBan,
  lucideLoaderCircle,
  lucidePlus,
  lucideTriangleAlert,
} from '@ng-icons/lucide';

@Component({
  selector: 'lc-line-entry-batch-editor',
  imports: [
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    IfErrorDirective,
    TranslocoDirective,
    MultiImageUploadComponent,
    FormControlDirective,
    LineEntryBatchLineFormComponent,
    AsyncPipe,
    LinePathFormComponent,
    FormsModule,
    HlmButton,
    ...SpartanStepperImports,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    ...HlmDatePickerImports,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideArrowRight,
      lucideBan,
      lucideLoaderCircle,
      lucidePlus,
      lucideTriangleAlert,
    }),
  ],
  templateUrl: './line-entry-batch-editor.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './line-entry-batch-editor.component.scss',
})
export class LineEntryBatchEditorComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild(SpartanStepper) stepper: SpartanStepper;

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

  public groupedScales: Record<LineType, Scale[]> = null;
  public defaultScales: Record<LineType, string | null> = {
    [LineType.BOULDER]: null,
    [LineType.SPORT]: null,
    [LineType.TRAD]: null,
  };

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private scalesService = inject(ScalesService);
  private languageService = inject(LanguageService);
  private batchEditorService = inject(BatchEditorService);
  private pageTitleService = inject(PageTitleService);

  public gymMode$ = this.store
    .select(selectGymMode)
    .pipe(takeUntilDestroyed(this.destroyRef));

  /** t(topoImage.batchUploadForm.batchImageUploadTitle) */
  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        'topoImage.batchUploadForm.batchImageUploadTitle',
      ),
    );
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

    this.scalesService.getScales().subscribe((scales) => {
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

      this.scaleOptions = this.groupedScales[LineType.BOULDER].map((scale) => ({
        label: scale.name,
        value: scale.name,
      }));

      this.buildForm();
      this.topoImageBatchUploadForm
        .get('lines.type')
        .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
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
        .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((item) => {
          this.scalesService
            .getScale(
              this.topoImageBatchUploadForm.get('lines.type').value,
              item,
            )
            .subscribe((scale) => {
              this.grades = this.filterGradesForSelect(scale.grades);
            });
        });

      this.topoImageBatchUploadForm
        .get('lines.type')
        .setValue(LineType.BOULDER);
    });
  }

  private filterGradesForSelect(grades: Grade[]) {
    let noClosedProjects = false;
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettings) => {
        noClosedProjects = instanceSettings.noClosedProjects;
      });
    return filterSelectableGrades(grades, { noClosedProjects });
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
          this.stepper?.next();
        });
    } else {
      this.topoImageBatchUploadForm.get('lines').markAllAsTouched();
    }
  }

  formatDay = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

  selectLabel = (value: unknown): string => {
    const match = [
      ...(this.typeOptions ?? []),
      ...(this.scaleOptions ?? []),
    ].find((option) => option.value === value);
    return match?.label ?? (value == null ? '' : String(value));
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
