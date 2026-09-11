import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { select, Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { LinePath } from '../../../models/line-path';
import { LinePathsService } from '../../../services/crud/line-paths.service';
import { LinesService } from '../../../services/crud/lines.service';
import { Line } from '../../../models/line';
import { TopoImagesService } from '../../../services/crud/topo-images.service';
import { forkJoin, Observable } from 'rxjs';
import { LinePathEditorComponent } from '../line-path-editor/line-path-editor.component';
import { Title } from '@angular/platform-browser';
import {
  TRANSLOCO_SCOPE,
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { ScalesService } from '../../../services/crud/scales.service';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { Select } from 'primeng/select';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { Button } from 'primeng/button';
import { TopoImage } from '../../../models/topo-image';
import { LineNumberBadgeComponent } from '../../shared/components/line-number-badge/line-number-badge.component';
import { sortLinePathsByOrderIndex } from '../../../utility/topo/line-path-numbering';
import { DrawMode } from '../../../utility/topo/line-path-draw-mode';
import { OrderList } from 'primeng/orderlist';
import { Checkbox } from 'primeng/checkbox';
import { Tag } from 'primeng/tag';
import { Message } from 'primeng/message';
import { AsyncPipe, NgClass } from '@angular/common';
import { ItemOrder } from '../../../interfaces/item-order.interface';
import {
  cloneTabuAreaIds,
  cloneTabuAreas,
  isCompleteTabuPolygon,
  TabuArea,
  tabuAreaIdsEqual,
  tabuAreasEqual,
  tabuPolygonHasKinks,
} from '../../../utility/topo/tabu-holds';

interface LinePathDraft {
  line: Line;
  path: number[];
  tabuAreaIds: string[];
  tabuInProgress: number[];
  linePathId?: string;
  orderIndex: number;
}

/**
 * Form for drawing and editing line paths on a topo image.
 */
@Component({
  selector: 'lc-line-path-form',
  templateUrl: './line-path-form.component.html',
  styleUrl: './line-path-form.component.scss',
  imports: [
    TranslocoDirective,
    TranslocoPipe,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    Select,
    FormControlDirective,
    LineGradePipe,
    IfErrorDirective,
    LinePathEditorComponent,
    Button,
    LineNumberBadgeComponent,
    OrderList,
    Checkbox,
    Tag,
    Message,
    FormsModule,
    AsyncPipe,
    NgClass,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'linePath' }],
})
export class LinePathFormComponent implements OnInit, OnChanges {
  @ViewChild(LinePathEditorComponent) linePathEditor: LinePathEditorComponent;

  @Input() selectedTopoImageId: string;
  @Input() embedded = false;

  public linePathForm: FormGroup;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public lines: Line[];
  public selectedTopoImage: TopoImage;
  public editorTopoImage: TopoImage;
  public draftPaths: Record<string, LinePathDraft> = {};
  public orderedDrafts: LinePathDraft[] = [];
  public linePathNumbers = new Map<string, number>();
  public isMobile$: Observable<boolean>;
  public selectedLineId: string;
  public allTabuAreas: TabuArea[] = [];
  public editorDrawMode: DrawMode = 'line';
  public editorTabuInProgress: number[] = [];

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;
  private originalPaths: Record<string, number[]> = {};
  private originalTabuAreaIds: Record<string, string[]> = {};
  private originalTabuAreas: TabuArea[] = [];
  private originalOrder: ItemOrder = {};
  private topoImageId: string;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private linesService = inject(LinesService);
  private topoImagesService = inject(TopoImagesService);
  private linePathsService = inject(LinePathsService);

  protected scalesService = inject(ScalesService);

  ngOnInit() {
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    this.topoImageId =
      this.selectedTopoImageId ||
      this.route.snapshot.paramMap.get('topo-image-id');
    if (this.topoImageId || (this.areaSlug && this.selectedTopoImageId)) {
      this.refreshData();
    }
    if (!this.embedded) {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('manageLinePathsBrowserTitle'))} - ${instanceName}`,
        );
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['selectedTopoImageId'] &&
      this.selectedTopoImageId &&
      this.areaSlug
    ) {
      this.topoImageId = this.selectedTopoImageId;
      this.refreshData();
    }
  }

  refreshData() {
    this.buildForm();
    this.loadingState = LoadingState.INITIAL_LOADING;
    this.draftPaths = {};
    this.originalPaths = {};
    this.originalTabuAreaIds = {};
    this.originalTabuAreas = [];
    this.originalOrder = {};
    this.orderedDrafts = [];
    this.allTabuAreas = [];
    this.editorDrawMode = 'line';
    this.editorTabuInProgress = [];
    forkJoin([
      this.linesService.getLinesForLineEditor(this.areaSlug),
      this.topoImagesService.getTopoImage(this.topoImageId),
    ]).subscribe(([lines, topoImage]) => {
      this.lines = lines;
      this.selectedTopoImage = topoImage;
      sortLinePathsByOrderIndex(topoImage.linePaths).forEach((linePath) => {
        this.draftPaths[linePath.line.id] = {
          line: linePath.line,
          path: [...linePath.path],
          tabuAreaIds: cloneTabuAreaIds(linePath.tabuAreaIds),
          tabuInProgress: [],
          linePathId: linePath.id,
          orderIndex: linePath.orderIndex,
        };
        this.originalPaths[linePath.line.id] = [...linePath.path];
        this.originalTabuAreaIds[linePath.line.id] = cloneTabuAreaIds(
          linePath.tabuAreaIds,
        );
        this.originalOrder[linePath.id] = linePath.orderIndex;
      });
      this.allTabuAreas = cloneTabuAreas(topoImage.tabuAreas);
      this.originalTabuAreas = cloneTabuAreas(topoImage.tabuAreas);
      this.refreshOrderedDrafts();
      const initialLine =
        lines.find((line) => !this.draftPaths[line.id]) ?? lines[0];
      this.selectedLineId = initialLine?.id;
      this.linePathEditor?.setDrawMode('line');
      this.updateEditorTopoImage(this.selectedLineId);
      this.linePathForm.patchValue({
        line: initialLine,
        path: initialLine ? (this.draftPaths[initialLine.id]?.path ?? []) : [],
        tabuAreaIds: initialLine
          ? cloneTabuAreaIds(this.draftPaths[initialLine.id]?.tabuAreaIds)
          : [],
      });
      this.editorTabuInProgress = [];
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  private buildForm() {
    this.linePathForm = this.fb.group({
      line: [null, [Validators.required]],
      path: [[], [Validators.minLength(4)]],
      tabuAreaIds: [[]],
    });
    this.linePathForm.get('path').valueChanges.subscribe(() => {
      this.persistCurrentLineDraft(true);
      this.refreshOrderedDrafts();
    });
  }

  onLineChange(newLine: Line) {
    if (!newLine || newLine.id === this.selectedLineId) {
      return;
    }
    if (!this.persistCurrentLineDraft()) {
      const previousLine = this.lines.find(
        (line) => line.id === this.selectedLineId,
      );
      this.linePathForm.patchValue(
        { line: previousLine },
        { emitEvent: false },
      );
      return;
    }
    this.refreshOrderedDrafts();
    this.selectedLineId = newLine.id;
    this.updateEditorTopoImage(newLine.id);
    const draft = this.draftPaths[newLine.id];
    const path = draft ? [...draft.path] : [];
    const tabuAreaIds = draft ? cloneTabuAreaIds(draft.tabuAreaIds) : [];
    this.linePathForm.patchValue({ path, tabuAreaIds }, { emitEvent: false });
    this.editorTabuInProgress = [...(draft?.tabuInProgress ?? [])];
  }

  selectDraft(draft: LinePathDraft) {
    if (draft.line.id === this.selectedLineId) {
      return;
    }
    this.linePathForm.patchValue({ line: draft.line }, { emitEvent: false });
    this.onLineChange(draft.line);
  }

  onDraftsReordered() {
    this.orderedDrafts.forEach((draft, index) => {
      draft.orderIndex = index;
      this.draftPaths[draft.line.id] = draft;
    });
    this.rebuildLinePathNumbers();
    this.updateEditorTopoImage(this.selectedLineId);
  }

  onPathChange(path: number[]) {
    this.linePathForm.get('path').setValue([...path]);
    this.linePathForm.get('path').markAsTouched();
  }

  onAllTabuAreasChange(areas: TabuArea[]) {
    this.allTabuAreas = cloneTabuAreas(areas);
    this.updateEditorTopoImage(this.selectedLineId);
  }

  onTabuAreaIdsChange(tabuAreaIds: string[]) {
    this.linePathForm
      .get('tabuAreaIds')
      .setValue(cloneTabuAreaIds(tabuAreaIds), { emitEvent: false });
    this.persistCurrentLineDraft(true, tabuAreaIds);
    this.updateEditorTopoImage(this.selectedLineId);
  }

  onEditorDrawModeChange(mode: DrawMode) {
    this.editorDrawMode = mode;
  }

  onTabuCheckboxChange(areaId: string, event: { checked?: boolean } | boolean) {
    const assigned = typeof event === 'boolean' ? event : !!event?.checked;
    this.onTabuAssignmentToggle({ areaId, assigned });
  }

  onTabuAssignmentToggle(event: { areaId: string; assigned: boolean }) {
    const line = this.linePathForm?.get('line').value as Line | null;
    if (!line || !this.isSelectedLineDrawn()) {
      return;
    }
    this.ensureDraftForLine(line);
    const draft = this.draftPaths[line.id];
    if (!draft) {
      return;
    }
    const alreadyAssigned = draft.tabuAreaIds.includes(event.areaId);
    if (event.assigned === alreadyAssigned) {
      return;
    }
    if (event.assigned) {
      draft.tabuAreaIds = [
        ...cloneTabuAreaIds(draft.tabuAreaIds),
        event.areaId,
      ];
    } else {
      draft.tabuAreaIds = draft.tabuAreaIds.filter((id) => id !== event.areaId);
    }
    this.draftPaths[line.id] = draft;
    if (line.id === this.selectedLineId) {
      this.syncSelectedLineTabuAreaIds(draft.tabuAreaIds);
    }
    this.updateEditorTopoImage(this.selectedLineId);
  }

  onTabuAreaDeleted(areaId: string) {
    Object.values(this.draftPaths).forEach((draft) => {
      draft.tabuAreaIds = draft.tabuAreaIds.filter((id) => id !== areaId);
    });
    if (this.selectedLineId && this.draftPaths[this.selectedLineId]) {
      this.syncSelectedLineTabuAreaIds(
        this.draftPaths[this.selectedLineId].tabuAreaIds,
      );
    } else {
      this.linePathForm.get('tabuAreaIds').setValue([], { emitEvent: false });
      this.editorTabuInProgress =
        this.linePathEditor?.getTabuInProgress() ?? [];
    }
    this.allTabuAreas = this.allTabuAreas.filter((area) => area.id !== areaId);
    this.updateEditorTopoImage(this.selectedLineId);
  }

  isTabuAssignedToSelectedLine(areaId: string): boolean {
    const ids =
      this.linePathForm?.get('tabuAreaIds')?.value ??
      this.draftPaths[this.selectedLineId]?.tabuAreaIds ??
      [];
    return cloneTabuAreaIds(ids).includes(areaId);
  }

  isSelectedLineDrawn(): boolean {
    const path = this.linePathForm?.get('path')?.value;
    return Array.isArray(path) && path.length >= 4;
  }

  private ensureDraftForLine(line: Line) {
    if (this.draftPaths[line.id]) {
      return;
    }
    const path =
      line.id === this.selectedLineId
        ? [...(this.linePathForm.get('path').value ?? [])]
        : [];
    this.draftPaths[line.id] = {
      line,
      path,
      tabuAreaIds: [],
      tabuInProgress: [],
      orderIndex:
        this.orderedDrafts.length > 0
          ? Math.max(...this.orderedDrafts.map((d) => d.orderIndex)) + 1
          : 0,
    };
    if (path.length >= 4) {
      this.refreshOrderedDrafts();
    }
  }

  private syncSelectedLineTabuAreaIds(tabuAreaIds: string[]) {
    const cloned = cloneTabuAreaIds(tabuAreaIds);
    this.linePathForm
      .get('tabuAreaIds')
      ?.setValue(cloned, { emitEvent: false });
  }

  private persistCurrentLineDraft(
    silent = false,
    tabuAreaIdsOverride?: string[],
  ): boolean {
    if (!this.selectedLineId) {
      return true;
    }
    if (!silent) {
      const tabuInProgress = this.linePathEditor?.getTabuInProgress() ?? [];
      if (tabuInProgress.length > 0 && !isCompleteTabuPolygon(tabuInProgress)) {
        this.store.dispatch(toastNotification('TABU_HOLD_INCOMPLETE'));
        return false;
      }
      if (tabuPolygonHasKinks(tabuInProgress)) {
        this.store.dispatch(toastNotification('TABU_HOLD_SELF_INTERSECTING'));
        return false;
      }
      if (isCompleteTabuPolygon(tabuInProgress)) {
        this.linePathEditor.finishTabuPolygon();
      }
    }
    const line = this.lines.find((l) => l.id === this.selectedLineId);
    const path: number[] = this.linePathForm.get('path').value ?? [];
    if (path.length === 2) {
      if (!silent) {
        this.store.dispatch(toastNotification('LINE_PATH_SINGLE_ANCHOR'));
      }
      return false;
    }
    const existing = this.draftPaths[this.selectedLineId];
    const tabuAreaIds = cloneTabuAreaIds(
      tabuAreaIdsOverride ??
        this.linePathForm.get('tabuAreaIds').value ??
        this.linePathEditor?.tabuAreaIds,
    );
    const tabuInProgress = this.linePathEditor?.getTabuInProgress() ?? [];
    if (path.length === 0) {
      if (existing && !existing.linePathId) {
        delete this.draftPaths[this.selectedLineId];
      } else if (existing) {
        existing.path = [];
        existing.tabuAreaIds = [];
        existing.tabuInProgress = [];
      }
      this.linePathForm.get('tabuAreaIds')?.setValue([], { emitEvent: false });
      return true;
    }
    this.draftPaths[this.selectedLineId] = {
      line,
      path: [...path],
      tabuAreaIds,
      tabuInProgress,
      linePathId: existing?.linePathId,
      orderIndex:
        existing?.orderIndex ??
        (this.orderedDrafts.length > 0
          ? Math.max(...this.orderedDrafts.map((d) => d.orderIndex)) + 1
          : 0),
    };
    return true;
  }

  private refreshOrderedDrafts() {
    this.orderedDrafts = Object.values(this.draftPaths)
      .filter((draft) => draft.path.length >= 4)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    this.rebuildLinePathNumbers();
  }

  private rebuildLinePathNumbers() {
    this.linePathNumbers = new Map(
      this.orderedDrafts.map((draft, index) => [draft.line.id, index + 1]),
    );
  }

  private updateEditorTopoImage(selectedLineId?: string) {
    if (!this.selectedTopoImage) {
      return;
    }
    const backgroundPaths = this.orderedDrafts
      .filter((draft) => draft.line.id !== selectedLineId)
      .map((draft) => {
        const linePath = new LinePath();
        linePath.path = [...draft.path];
        linePath.tabuAreaIds = cloneTabuAreaIds(draft.tabuAreaIds);
        linePath.line = draft.line;
        linePath.orderIndex = draft.orderIndex;
        return linePath;
      });
    this.editorTopoImage = Object.assign(
      Object.create(Object.getPrototypeOf(this.selectedTopoImage)),
      this.selectedTopoImage,
      {
        linePaths: sortLinePathsByOrderIndex(backgroundPaths),
        tabuAreas: cloneTabuAreas(this.allTabuAreas),
      },
    );
  }

  getLineNumber(line: Line): number | null {
    return this.linePathNumbers.get(line.id) ?? null;
  }

  leaveEditor() {
    this.router.navigate([
      '/topo',
      this.cragSlug,
      this.sectorSlug,
      this.areaSlug,
      'topo-images',
    ]);
  }

  public saveAllLinePaths() {
    if (!this.persistCurrentLineDraft()) {
      return;
    }
    this.refreshOrderedDrafts();

    const singleAnchorDraft = Object.values(this.draftPaths).some(
      (draft) => draft.path.length === 2,
    );
    if (singleAnchorDraft) {
      this.store.dispatch(toastNotification('LINE_PATH_SINGLE_ANCHOR'));
      return;
    }

    if (!this.hasLinePathChanges()) {
      this.store.dispatch(toastNotification('LINE_PATH_NOTHING_TO_SAVE'));
      return;
    }

    const linePaths = this.orderedDrafts.map((draft) => {
      const linePath = new LinePath();
      linePath.path = draft.path;
      linePath.tabuAreaIds = cloneTabuAreaIds(draft.tabuAreaIds);
      linePath.line = draft.line;
      if (draft.linePathId) {
        linePath.id = draft.linePathId;
      }
      return linePath;
    });

    this.loadingState = LoadingState.LOADING;
    this.linePathsService
      .syncLinePaths(linePaths, this.topoImageId, this.allTabuAreas)
      .subscribe((savedLinePaths) => {
        savedLinePaths.forEach((saved, index) => {
          const draft = this.draftPaths[saved.line.id];
          if (draft) {
            draft.linePathId = saved.id;
            draft.path = [...saved.path];
            draft.tabuAreaIds = cloneTabuAreaIds(saved.tabuAreaIds);
            draft.tabuInProgress = [];
            draft.orderIndex = index;
            this.draftPaths[saved.line.id] = draft;
          }
        });
        Object.keys(this.draftPaths).forEach((lineId) => {
          const draft = this.draftPaths[lineId];
          if (draft.linePathId && draft.path.length < 4) {
            delete this.draftPaths[lineId];
          }
        });
        this.store.dispatch(toastNotification('LINE_PATHS_SAVED'));
        this.loadingState = LoadingState.DEFAULT;
        if (this.embedded) {
          this.refreshData();
        } else {
          this.leaveEditor();
        }
      });
  }

  private hasLinePathChanges(): boolean {
    const clearedExistingLine = Object.values(this.draftPaths).some(
      (draft) => draft.linePathId && draft.path.length < 4,
    );
    if (clearedExistingLine) {
      return true;
    }

    const currentLineIds = new Set(
      this.orderedDrafts.map((draft) => draft.line.id),
    );
    const originalLineIds = new Set(Object.keys(this.originalPaths));
    if (
      currentLineIds.size !== originalLineIds.size ||
      [...currentLineIds].some((lineId) => !originalLineIds.has(lineId)) ||
      [...originalLineIds].some((lineId) => !currentLineIds.has(lineId))
    ) {
      return true;
    }

    if (!tabuAreasEqual(this.originalTabuAreas, this.allTabuAreas)) {
      return true;
    }

    return this.orderedDrafts.some((draft) => {
      const original = this.originalPaths[draft.line.id];
      if (!original) {
        return true;
      }
      if (JSON.stringify(original) !== JSON.stringify(draft.path)) {
        return true;
      }
      if (
        !tabuAreaIdsEqual(
          this.originalTabuAreaIds[draft.line.id],
          draft.tabuAreaIds,
        )
      ) {
        return true;
      }
      if (!draft.linePathId) {
        return true;
      }
      return this.originalOrder[draft.linePathId] !== draft.orderIndex;
    });
  }
}
