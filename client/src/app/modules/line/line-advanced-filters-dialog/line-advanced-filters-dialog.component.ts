import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { StartingPosition } from '../../../enums/starting-position';
import { Drying } from '../../../enums/drying';
import { LineType } from '../../../enums/line-type';
import { ScalesService } from '../../../services/crud/scales.service';
import { GradeRangeSliderComponent } from '../../shared/components/grade-range-slider/grade-range-slider.component';
import { RatingRangeSliderComponent } from '../../shared/components/rating-range-slider/rating-range-slider.component';
import {
  defaultLineListAdvancedFilters,
  defaultLineListScaleKey,
  lineListSliderScale,
  LineListAdvancedFilters,
  LineListBoolKey,
  LineListFiltersDialogResult,
  LineListScaleSelectItem,
  sanitizeLineListAdvancedFilters,
} from '../line-list-filters/line-list-filter.logic';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideRefreshCw, lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';

export interface LineAdvancedFiltersDialogData {
  initial: LineListAdvancedFilters;
  availableScales: LineListScaleSelectItem[];
  scaleKey: LineListScaleSelectItem;
  gradeFilterRange: number[];
  maxGradeValue: number | null;
}

@Component({
  selector: 'lc-line-advanced-filters-dialog',
  templateUrl: './line-advanced-filters-dialog.component.html',
  styleUrl: './line-advanced-filters-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    TranslocoDirective,
    GradeRangeSliderComponent,
    RatingRangeSliderComponent,
    HlmButton,
    HlmCheckbox,
    ...HlmSelectImports,
    ...HlmDatePickerImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideCheck, lucideRefreshCw, lucideX })],
})
export class LineAdvancedFiltersDialogComponent implements OnInit {
  draft: LineListAdvancedFilters;
  availableScales: LineListScaleSelectItem[] = [];
  dialogScaleKey: LineListScaleSelectItem;
  /** Min/max grade values for the range slider (only meaningful when `maxGrade` is set). */
  gradeRange: number[] = [-2, -2];
  maxGrade: number | null = null;
  readonly minGradeValue = -2;
  readonly faYearMinDate = new Date(1800, 0, 1);
  readonly faYearMaxDate = new Date(2100, 11, 31);

  videoOptions: { label: string; value: string }[];
  climbOptions: { label: string; value: string }[];
  startingPositionOptions: { label: string; value: StartingPosition | null }[];
  dryingOptions: { label: string; value: Drying | null }[];

  readonly boolGeneralKeys: LineListBoolKey[] = [
    'variant',
    'eliminate',
    'traverse',
    'highball',
    'lowball',
    'morpho',
    'noTopout',
    'badDropzone',
    'childFriendly',
  ];
  readonly boolAngleKeys: LineListBoolKey[] = [
    'roof',
    'slab',
    'vertical',
    'overhang',
  ];
  readonly boolMovementKeys: LineListBoolKey[] = [
    'athletic',
    'technical',
    'endurance',
    'cruxy',
    'dyno',
  ];
  readonly boolHoldKeys: LineListBoolKey[] = [
    'jugs',
    'sloper',
    'crimps',
    'pockets',
    'pinches',
  ];
  readonly boolStructureKeys: LineListBoolKey[] = [
    'crack',
    'dihedral',
    'compression',
    'arete',
    'mantle',
  ];

  protected scalesService = inject(ScalesService);

  /** Grade scale drawn on the slider, including while the line type is "ALL". */
  get sliderScaleItem(): LineListScaleSelectItem | undefined {
    return lineListSliderScale(this.availableScales, this.dialogScaleKey);
  }

  private dialogContext =
    injectBrnDialogContext<LineAdvancedFiltersDialogData>();
  private ref = inject(BrnDialogRef);
  private transloco = inject(TranslocoService);

  constructor() {
    const data = this.dialogContext;

    // Advanced filters (rating, bools, FA year, etc.) — independent of header grade slider.
    this.draft = sanitizeLineListAdvancedFilters(
      data?.initial ?? defaultLineListAdvancedFilters(),
    );

    // Clone so dialog edits do not mutate the parent line list's scale options.
    this.availableScales = cloneScaleItems(data?.availableScales ?? []);

    // Match parent scale by value; fall back to passed key or empty "ALL" placeholder.
    const parentScaleKey = data?.scaleKey;
    this.dialogScaleKey = this.availableScales.find(
      (s) =>
        (s.value == null && parentScaleKey?.value == null) ||
        (s.value != null &&
          parentScaleKey?.value != null &&
          s.value.lineType === parentScaleKey.value.lineType &&
          s.value.gradeScale === parentScaleKey.value.gradeScale),
    ) ??
      parentScaleKey ?? { label: '', value: undefined };

    // Mirror header slider state when a concrete scale is active; otherwise leave slider inert.
    const parentRange = data?.gradeFilterRange;
    const parentMax = data?.maxGradeValue;
    if (
      parentMax != null &&
      Array.isArray(parentRange) &&
      parentRange.length >= 2
    ) {
      this.gradeRange = [Number(parentRange[0]), Number(parentRange[1])];
    } else if (parentMax != null) {
      this.gradeRange = [-2, parentMax];
    } else {
      this.gradeRange = [-2, -2];
    }
    this.maxGrade = data?.maxGradeValue ?? null;
  }

  ngOnInit(): void {
    this.videoOptions = [
      {
        label: this.transloco.translate(
          marker('line.lineList.advancedFiltersVideoAny'),
        ),
        value: 'any',
      },
      {
        label: this.transloco.translate(
          marker('line.lineList.advancedFiltersVideoYes'),
        ),
        value: 'yes',
      },
      {
        label: this.transloco.translate(
          marker('line.lineList.advancedFiltersVideoNo'),
        ),
        value: 'no',
      },
    ];
    this.climbOptions = [
      {
        label: this.transloco.translate(
          marker('line.lineList.advancedFiltersClimbAny'),
        ),
        value: 'any',
      },
      {
        label: this.transloco.translate(
          marker('line.lineList.advancedFiltersClimbClimbed'),
        ),
        value: 'climbed',
      },
      {
        label: this.transloco.translate(
          marker('line.lineList.advancedFiltersClimbNotClimbed'),
        ),
        value: 'notClimbed',
      },
    ];
    this.startingPositionOptions = [
      {
        label: this.transloco.translate(
          'line.lineList.advancedFiltersStartingPositionsPlaceholder',
        ),
        value: null,
      },
      ...Object.values(StartingPosition).map((value) => ({
        label: this.transloco.translate(value),
        value,
      })),
    ];
    this.dryingOptions = [
      {
        label: this.transloco.translate(
          'line.lineList.advancedFiltersDryingPlaceholder',
        ),
        value: null,
      },
      ...Object.values(Drying).map((value) => ({
        label: this.transloco.translate(value),
        value,
      })),
    ];
    if (this.maxGrade == null && this.sliderScaleItem?.value) {
      this.applyScaleKeyToGradeBounds(this.dialogScaleKey);
    }
  }

  /** User picked a different scale in the dialog — reload slider bounds for that scale. */
  onDialogScaleChange(): void {
    this.applyScaleKeyToGradeBounds(this.dialogScaleKey);
  }

  boolRequired(key: LineListBoolKey): boolean {
    return this.draft.requiredBoolKeys.includes(key);
  }

  toggleBool(key: LineListBoolKey, checked: boolean): void {
    if (checked) {
      if (!this.draft.requiredBoolKeys.includes(key)) {
        this.draft.requiredBoolKeys = [...this.draft.requiredBoolKeys, key];
      }
    } else {
      this.draft.requiredBoolKeys = this.draft.requiredBoolKeys.filter(
        (k) => k !== key,
      );
    }
  }

  onRatingRangeChange(values: number[]): void {
    if (!values?.length) return;
    this.draft.minRating = values[0];
    this.draft.maxRating = values[1] ?? values[0];
  }

  /** Mid-year anchor so the year picker round-trips cleanly (same idea as the line form). */
  yearToDate(year: number | null): Date | null {
    if (year == null || year <= 0) return null;
    return new Date(year, 6, 15);
  }

  onFaYearFromChange(value: Date | null): void {
    this.draft.faYearFrom = value ? value.getFullYear() : null;
  }

  onFaYearToChange(value: Date | null): void {
    this.draft.faYearTo = value ? value.getFullYear() : null;
  }

  reset(): void {
    this.draft = defaultLineListAdvancedFilters();
    // Same default scale rules as the line list header (see defaultLineListScaleKey).
    const defaultScale = defaultLineListScaleKey(this.availableScales);
    if (!defaultScale) {
      this.dialogScaleKey = { label: '', value: undefined };
      this.maxGrade = null;
      this.gradeRange = [-2, -2];
      return;
    }
    this.dialogScaleKey = defaultScale;
    this.applyScaleKeyToGradeBounds(this.dialogScaleKey);
  }

  formatYear = (date: Date) => String(date.getFullYear());

  selectLabel = (value: unknown): string => {
    const lists = [
      this.videoOptions,
      this.climbOptions,
      this.startingPositionOptions,
      this.dryingOptions,
    ];
    for (const list of lists) {
      const match = list?.find((option) => option.value === value);
      if (match?.label) {
        return match.label;
      }
    }
    return value == null ? '' : String(value);
  };

  cancel(): void {
    this.ref.close();
  }

  apply(): void {
    const narrowed =
      this.maxGrade != null &&
      (this.gradeRange[0] !== this.minGradeValue ||
        this.gradeRange[1] !== this.maxGrade);
    const scaleKey = this.dialogScaleKey?.value
      ? this.dialogScaleKey
      : narrowed
        ? this.sliderScaleItem
        : this.dialogScaleKey;
    const gradeFilterRange: (number | null)[] =
      scaleKey?.value && this.maxGrade != null
        ? [this.gradeRange[0], this.gradeRange[1]]
        : [-2, null];
    const payload: LineListFiltersDialogResult = {
      advanced: sanitizeLineListAdvancedFilters(this.draft),
      scaleKey,
      gradeFilterRange,
      maxGradeValue: scaleKey?.value ? this.maxGrade : null,
    };
    this.ref.close(payload);
  }

  private applyScaleKeyToGradeBounds(scaleKey: LineListScaleSelectItem): void {
    const sliderScale = lineListSliderScale(this.availableScales, scaleKey);
    if (sliderScale?.value) {
      this.scalesService
        .getScale(sliderScale.value.lineType, sliderScale.value.gradeScale)
        .subscribe((scale) => {
          this.maxGrade = Math.max(...scale.grades.map((g) => g.value));
          this.gradeRange = [-2, this.maxGrade];
        });
    } else {
      this.maxGrade = null;
      this.gradeRange = [-2, -2];
    }
  }
}

/** Shallow copy of scale options so label edits in the dialog stay isolated. */
function cloneScaleItems(
  items: LineListScaleSelectItem[],
): LineListScaleSelectItem[] {
  return items.map((s): LineListScaleSelectItem => ({
    label: s.label,
    value: s.value
      ? {
          lineType: s.value.lineType as LineType,
          gradeScale: s.value.gradeScale,
        }
      : undefined,
  }));
}
