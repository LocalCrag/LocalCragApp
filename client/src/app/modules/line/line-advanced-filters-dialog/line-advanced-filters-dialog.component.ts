import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Select } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { DatePicker } from 'primeng/datepicker';
import { StartingPosition } from '../../../enums/starting-position';
import { LineType } from '../../../enums/line-type';
import { ScalesService } from '../../../services/crud/scales.service';
import { SliderLabelsComponent } from '../../shared/components/slider-labels/slider-labels.component';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import {
  defaultLineListAdvancedFilters,
  defaultLineListScaleKey,
  LineListAdvancedFilters,
  LineListBoolKey,
  LineListFiltersDialogResult,
  LineListScaleSelectItem,
  sanitizeLineListAdvancedFilters,
} from '../line-list-filters/line-list-filter.logic';

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
  imports: [
    FormsModule,
    TranslocoDirective,
    Button,
    Checkbox,
    Select,
    SliderModule,
    DatePicker,
    SliderLabelsComponent,
    TranslateSpecialGradesPipe,
    AsyncPipe,
  ],
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

  readonly boolGeneralKeys: LineListBoolKey[] = [
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

  private dialogConfig = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private transloco = inject(TranslocoService);

  constructor() {
    const data = this.dialogConfig.data as LineAdvancedFiltersDialogData;

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

  cancel(): void {
    this.ref.close();
  }

  apply(): void {
    // Only pass a grade range when a concrete scale is selected; "ALL" clears header filtering.
    const gradeFilterRange: (number | null)[] =
      this.maxGrade != null && this.dialogScaleKey?.value
        ? [this.gradeRange[0], this.gradeRange[1]]
        : [-2, null];
    const payload: LineListFiltersDialogResult = {
      advanced: sanitizeLineListAdvancedFilters(this.draft),
      scaleKey: this.dialogScaleKey,
      gradeFilterRange,
      maxGradeValue: this.maxGrade,
    };
    this.ref.close(payload);
  }

  private applyScaleKeyToGradeBounds(scaleKey: LineListScaleSelectItem): void {
    if (scaleKey?.value) {
      this.scalesService
        .getScale(scaleKey.value.lineType, scaleKey.value.gradeScale)
        .subscribe((scale) => {
          this.maxGrade = Math.max(...scale.grades.map((g) => g.value));
          // Full range until the user narrows it on the slider.
          this.gradeRange = [-2, this.maxGrade];
        });
    } else {
      // "ALL" — hide slider and do not filter by grade in the list query.
      this.maxGrade = null;
      this.gradeRange = [-2, -2];
    }
  }
}

/** Shallow copy of scale options so label edits in the dialog stay isolated. */
function cloneScaleItems(
  items: LineListScaleSelectItem[],
): LineListScaleSelectItem[] {
  return items.map(
    (s): LineListScaleSelectItem => ({
      label: s.label,
      value: s.value
        ? {
            lineType: s.value.lineType as LineType,
            gradeScale: s.value.gradeScale,
          }
        : undefined,
    }),
  );
}
