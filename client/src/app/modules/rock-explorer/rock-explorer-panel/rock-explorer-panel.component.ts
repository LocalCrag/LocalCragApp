import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Badge } from 'primeng/badge';
import { Popover } from 'primeng/popover';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { Searchable } from '../../../models/searchable';
import { Tag } from '../../../models/tag';
import { Grade, Scale } from '../../../models/scale';
import { RockExplorerPotential } from '../../../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../../../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../../../enums/rock-explorer-rock-type';
import { RockExplorerAccessIssue } from '../../../enums/rock-explorer-access-issue';
import { LineType } from '../../../enums/line-type';
import { ScalesService } from '../../../services/crud/scales.service';
import { RockExplorerGalleryComponent } from '../rock-explorer-gallery/rock-explorer-gallery.component';
import { RockExplorerMiscComponent } from '../rock-explorer-misc/rock-explorer-misc.component';
import { CommentsComponent } from '../../comments/comments/comments.component';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { TagComponent } from '../../shared/components/tag/tag.component';
import { TagInputComponent } from '../../shared/forms/controls/tag-input/tag-input.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { gradeRangeValidator } from '../../../utility/validators/grade-range.validator';
import { RouterLink } from '@angular/router';
import { Position } from 'geojson';
import { dedupePositions } from '../../../utility/geo/convex-hull';
import { RockExplorerUiService } from '../rock-explorer-ui.service';

type SelectOption = { label: string; value: string };
export type RockExplorerPanelTab = 'info' | 'images' | 'comments' | 'misc';
type PanelTab = RockExplorerPanelTab;

@Component({
  selector: 'lc-rock-explorer-panel',
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    MultiSelect,
    InputText,
    Textarea,
    Badge,
    Popover,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TranslocoDirective,
    TranslocoPipe,
    CommentsComponent,
    RockExplorerGalleryComponent,
    RockExplorerMiscComponent,
    TranslateSpecialGradesPipe,
    TagComponent,
    TagInputComponent,
    HasPermissionDirective,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    UserAvatarComponent,
    RouterLink,
  ],
  templateUrl: './rock-explorer-panel.component.html',
  styleUrl: './rock-explorer-panel.component.scss',
})
export class RockExplorerPanelComponent {
  @ViewChild('panelGallery') gallery?: RockExplorerGalleryComponent;
  @ViewChild('panelMisc') misc?: RockExplorerMiscComponent;
  @ViewChild(FormDirective) private featureFormDirective?: FormDirective;

  readonly ui = inject(RockExplorerUiService);

  public panelActiveTab: PanelTab = 'info';
  public panelImageCount = 0;
  public panelCommentCount = 0;
  public panelMiscCount = 0;
  public imageEditMode = false;
  public miscEditMode = false;

  public accessIssueOptions: SelectOption[] = [];
  public lineTypeOptions: SelectOption[] = [];
  public scaleOptions: SelectOption[] = [];
  public gradeOptions: Grade[] = [];

  public featureForm = inject(FormBuilder).group({
    title: ['', [Validators.maxLength(120)]],
    description: [''],
    potential: [null as string | null, Validators.required],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
    gradeLineType: [null as string | null],
    gradeScale: [null as string | null],
    gradeValueMin: [null as number | null],
    gradeValueMax: [null as number | null, gradeRangeValidator()],
    accessIssues: [[] as string[]],
    topoLinks: [[] as Searchable[]],
  });

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private transloco = inject(TranslocoService);
  private scalesService = inject(ScalesService);
  private groupedScales: Record<LineType, Scale[]> = {
    [LineType.BOULDER]: [],
    [LineType.SPORT]: [],
    [LineType.TRAD]: [],
  };
  private gradeCascadeReady = false;
  private suppressGradeCascade = false;

  constructor() {
    this.scalesService
      .getScales()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scales) => this.initGradeCascade(scales));
    this.rebuildAccessIssueOptions();
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.rebuildAccessIssueOptions();
        this.rebuildLineTypeOptions();
        // langChanges$ emits synchronously on subscribe; detectChanges during
        // view creation (panel opened via @if) throws "Should be run in update mode".
        queueMicrotask(() => this.cdr.detectChanges());
      });
  }

  public showFeature(
    feature: RockExplorerFeature,
    formActive: boolean,
    options?: { tab?: PanelTab },
  ): void {
    this.resetTabs();
    if (options?.tab) {
      this.panelActiveTab = options.tab;
    }
    this.imageEditMode = false;
    this.miscEditMode = false;
    this.setFeatureFormActive(formActive);
    this.patchFeatureForm(feature);
    this.cdr.detectChanges();
  }

  public showCreateForm(): void {
    this.resetTabs();
    this.imageEditMode = false;
    this.miscEditMode = false;
    this.setFeatureFormActive(true);
    this.featureForm.reset({
      title: '',
      description: '',
      potential: null,
      rockQuality: null,
      rockType: null,
      gradeLineType: null,
      gradeScale: null,
      gradeValueMin: null,
      gradeValueMax: null,
      accessIssues: [],
      topoLinks: [],
    });
    this.scaleOptions = [];
    this.gradeOptions = [];
    this.cdr.detectChanges();
  }

  public reset(): void {
    this.resetTabs();
    this.imageEditMode = false;
    this.miscEditMode = false;
    this.gallery?.cancelEdit();
    this.misc?.cancelEdit();
    this.featureForm.reset({
      title: '',
      description: '',
      potential: null,
      rockQuality: null,
      rockType: null,
      gradeLineType: null,
      gradeScale: null,
      gradeValueMin: null,
      gradeValueMax: null,
      accessIssues: [],
      topoLinks: [],
    });
    this.scaleOptions = [];
    this.gradeOptions = [];
  }

  public onSaveFeature(): void {
    if (this.featureForm.invalid) {
      this.featureForm.markAllAsTouched();
      this.featureFormDirective?.markAsTouched();
      return;
    }
    const raw = this.featureForm.getRawValue();
    const feature = this.ui.editingFeature()
      ? Object.assign(new RockExplorerFeature(), this.ui.editingFeature())
      : new RockExplorerFeature();
    if (!feature.parkingSites) {
      feature.parkingSites = [];
    }
    if (!feature.paths) {
      feature.paths = [];
    }
    if (!feature.status) {
      feature.status = 'published';
    }
    feature.title = raw.title?.trim() || null;
    feature.description = raw.description?.trim() || null;
    feature.potential = raw.potential as RockExplorerPotential;
    feature.rockQuality = (raw.rockQuality as RockExplorerRockQuality) || null;
    feature.rockType = (raw.rockType as RockExplorerRockType) || null;
    feature.gradeLineType = (raw.gradeLineType as LineType) || null;
    feature.gradeScale = raw.gradeScale || null;
    feature.gradeValueMin = raw.gradeValueMin;
    feature.gradeValueMax = raw.gradeValueMax;
    feature.accessIssues = (raw.accessIssues ||
      []) as RockExplorerAccessIssue[];
    this.applyTopoLinksToEntity(feature);
    this.ui.dispatch({ type: 'saveFeature', feature });
  }

  public enterFeatureEdit(): void {
    const feature = this.ui.editingFeature();
    if (!feature?.id) {
      return;
    }
    this.setFeatureFormActive(true);
    this.patchFeatureForm(feature);
    this.cdr.detectChanges();
  }

  public cancelFeatureEdit(): void {
    const feature = this.ui.editingFeature();
    if (!feature?.id) {
      this.ui.dispatch({ type: 'closePanel' });
      return;
    }
    this.setFeatureFormActive(false);
    this.patchFeatureForm(feature);
    this.cdr.detectChanges();
  }

  public onPanelTabChange(tab: string | number): void {
    if (tab !== 'images' && this.gallery?.editMode) {
      this.gallery.cancelEdit();
    }
    if (tab !== 'misc' && this.misc?.editMode) {
      this.misc.cancelEdit();
    }
  }

  public enumLabel(
    group: 'potential' | 'rockQuality' | 'rockType' | 'accessIssue',
    value: string | null | undefined,
  ): string {
    if (!value) {
      return '';
    }
    return this.transloco.translate(`rockExplorer.${group}.${value}`);
  }

  public accessIssuesLabel(issues: string[] | null | undefined): string {
    return (issues ?? [])
      .map((v) => this.enumLabel('accessIssue', v))
      .join(', ');
  }

  public featureGradeLabel(feature: RockExplorerFeature): string | null {
    const parts: string[] = [];
    if (feature.gradeLineType) {
      parts.push(this.transloco.translate(feature.gradeLineType));
    }
    if (feature.gradeScale) {
      parts.push(feature.gradeScale);
    }
    if (feature.gradeValueMin != null || feature.gradeValueMax != null) {
      const minName = this.gradeNameForValue(feature.gradeValueMin);
      const maxName = this.gradeNameForValue(feature.gradeValueMax);
      const min =
        minName ??
        (feature.gradeValueMin != null ? String(feature.gradeValueMin) : '?');
      const max =
        maxName ??
        (feature.gradeValueMax != null ? String(feature.gradeValueMax) : '?');
      parts.push(min === max ? min : `${min}–${max}`);
    }
    return parts.length ? parts.join(' · ') : null;
  }

  private collectOverlayPoints(): Position[] {
    const points: Position[] = [];
    for (const feature of this.gallery?.getGeotaggedMapFeatures() ?? []) {
      if (feature.geometry?.type === 'Point') {
        points.push([
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1],
        ]);
      }
    }
    const editing = this.ui.editingFeature();
    const parkings = this.misc?.parkingSites ?? editing?.parkingSites ?? [];
    for (const site of parkings) {
      if (site.lat != null && site.lng != null) {
        points.push([site.lng, site.lat]);
      }
    }
    const paths = this.misc?.paths ?? editing?.paths ?? [];
    for (const path of paths) {
      for (const coord of path.geometry?.coordinates ?? []) {
        if (coord.length >= 2) {
          points.push([coord[0], coord[1]]);
        }
      }
    }
    return points;
  }

  /** Need ≥3 distinct image/parking/path anchors for a meaningful hull. */
  public get canAutoRedrawGeometry(): boolean {
    return dedupePositions(this.collectOverlayPoints()).length >= 3;
  }

  public potentialColor(value: string | null | undefined): string {
    return this.ui.potentialColor(value);
  }

  private setFeatureFormActive(active: boolean): void {
    this.ui.setFeatureFormActive(active);
  }

  private resetTabs(): void {
    this.panelActiveTab = 'info';
    this.panelImageCount = 0;
    this.panelCommentCount = 0;
    this.panelMiscCount = 0;
  }

  private applyTopoLinksToEntity(entity: RockExplorerFeature): void {
    const searchables =
      (this.featureForm.getRawValue().topoLinks as Searchable[]) ?? [];
    entity.topoLinks = searchables.map(Tag.fromSearchable);
  }

  private patchFeatureForm(feature: RockExplorerFeature): void {
    this.suppressGradeCascade = true;
    this.featureForm.patchValue({
      title: feature.title ?? '',
      description: feature.description ?? '',
      potential: feature.potential,
      rockQuality: feature.rockQuality,
      rockType: feature.rockType,
      gradeLineType: feature.gradeLineType,
      gradeScale: feature.gradeScale,
      gradeValueMin: feature.gradeValueMin,
      gradeValueMax: feature.gradeValueMax,
      accessIssues: feature.accessIssues ?? [],
      topoLinks: (feature.topoLinks ?? []).map(Tag.toSearchable),
    });
    this.suppressGradeCascade = false;
    this.loadGradeCascade(
      feature.gradeLineType,
      feature.gradeScale,
      feature.gradeValueMin,
      feature.gradeValueMax,
      this.featureForm,
    );
  }

  private gradeNameForValue(value: number | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const grade = this.gradeOptions.find((g) => g.value === value);
    return grade?.name ?? null;
  }

  private rebuildAccessIssueOptions(): void {
    this.accessIssueOptions = Object.values(RockExplorerAccessIssue).map(
      (value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.accessIssue.${value}`),
      }),
    );
  }

  private rebuildLineTypeOptions(): void {
    this.lineTypeOptions = Object.entries(this.groupedScales)
      .filter(([, scales]) => scales.length > 0)
      .map(([lineType]) => ({
        value: lineType,
        label: this.transloco.translate(lineType),
      }));
  }

  private initGradeCascade(scales: Scale[]): void {
    this.groupedScales = {
      [LineType.BOULDER]: [],
      [LineType.SPORT]: [],
      [LineType.TRAD]: [],
    };
    scales
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((scale) => this.groupedScales[scale.lineType].push(scale));
    this.rebuildLineTypeOptions();
    if (!this.gradeCascadeReady) {
      this.wireGradeCascade(this.featureForm);
      this.gradeCascadeReady = true;
    }
  }

  private wireGradeCascade(form: FormGroup): void {
    form
      .get('gradeLineType')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lineType) => {
        if (this.suppressGradeCascade) {
          return;
        }
        this.onGradeLineTypeChanged(lineType as LineType | null, form);
      });
    form
      .get('gradeScale')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scale) => {
        if (this.suppressGradeCascade) {
          return;
        }
        this.onGradeScaleChanged(
          form.get('gradeLineType')!.value as LineType | null,
          scale,
          form,
          false,
        );
      });
    form
      .get('gradeValueMin')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((min) => {
        if (this.suppressGradeCascade) {
          return;
        }
        if (min != null && form.get('gradeValueMax')!.value == null) {
          this.suppressGradeCascade = true;
          form.patchValue({ gradeValueMax: min });
          this.suppressGradeCascade = false;
        }
        form.get('gradeValueMax')!.updateValueAndValidity({ emitEvent: false });
      });
    form
      .get('gradeValueMax')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((max) => {
        if (this.suppressGradeCascade || max == null) {
          return;
        }
        if (form.get('gradeValueMin')!.value == null) {
          this.suppressGradeCascade = true;
          form.patchValue({ gradeValueMin: max });
          this.suppressGradeCascade = false;
        }
      });
  }

  private selectableGrades(grades: Grade[]): Grade[] {
    return grades.filter((grade) => grade.value > 0);
  }

  private onGradeLineTypeChanged(lineType: LineType | null, form: FormGroup) {
    this.scaleOptions = lineType
      ? this.groupedScales[lineType].map((scale) => ({
          label: scale.name,
          value: scale.name,
        }))
      : [];
    this.gradeOptions = [];
    this.suppressGradeCascade = true;
    form.patchValue({
      gradeScale: null,
      gradeValueMin: null,
      gradeValueMax: null,
    });
    this.suppressGradeCascade = false;
    this.cdr.detectChanges();
  }

  private onGradeScaleChanged(
    lineType: LineType | null,
    scaleName: string | null,
    form: FormGroup,
    preserveValues: boolean,
  ) {
    if (!lineType || !scaleName) {
      this.gradeOptions = [];
      if (!preserveValues) {
        this.suppressGradeCascade = true;
        form.patchValue({ gradeValueMin: null, gradeValueMax: null });
        this.suppressGradeCascade = false;
      }
      this.cdr.detectChanges();
      return;
    }
    this.scalesService
      .getScale(lineType, scaleName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scale) => {
        this.gradeOptions = this.selectableGrades(scale.grades);
        if (!preserveValues) {
          this.suppressGradeCascade = true;
          form.patchValue({ gradeValueMin: null, gradeValueMax: null });
          this.suppressGradeCascade = false;
        }
        this.cdr.detectChanges();
      });
  }

  private loadGradeCascade(
    lineType: LineType | null | undefined,
    scaleName: string | null | undefined,
    min: number | null | undefined,
    max: number | null | undefined,
    form: FormGroup,
  ) {
    this.scaleOptions = lineType
      ? this.groupedScales[lineType].map((scale) => ({
          label: scale.name,
          value: scale.name,
        }))
      : [];
    this.gradeOptions = [];
    if (!lineType || !scaleName) {
      return;
    }
    this.scalesService
      .getScale(lineType, scaleName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scale) => {
        this.gradeOptions = this.selectableGrades(scale.grades);
        this.suppressGradeCascade = true;
        form.patchValue({
          gradeValueMin: min ?? null,
          gradeValueMax: max ?? null,
        });
        this.suppressGradeCascade = false;
        this.cdr.detectChanges();
      });
  }
}
