import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { TopoImage } from '../../../models/topo-image';
import { LinePath } from '../../../models/line-path';
import { Line } from '../../../models/line';
import { TopoImageEditorComponent } from '../../shared/components/topo-image/topo-image-editor.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { getAbsoluteCoordinates } from '../../shared/components/topo-image/topo-image-canvas.utils';
import { DrawMode } from '../../../utility/topo/line-path-draw-mode';
import {
  cloneTabuAreaIds,
  cloneTabuAreas,
  createTabuArea,
  isCompleteTabuPolygon,
  TabuArea,
  tabuPolygonHasKinks,
} from '../../../utility/topo/tabu-holds';

/**
 * Interactive canvas for drawing and editing a line path and tabu areas on a topo image.
 * Parent state is bound with path, tabuAreaIds, and allTabuAreas inputs/outputs.
 */
@Component({
  selector: 'lc-line-path-editor',
  templateUrl: './line-path-editor.component.html',
  styleUrls: ['./line-path-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    TopoImageEditorComponent,
    Button,
    ContextMenu,
    Select,
    FormsModule,
  ],
})
export class LinePathEditorComponent implements OnInit, OnChanges {
  @ViewChild(TopoImageEditorComponent)
  topoImageComponent: TopoImageEditorComponent;
  @ViewChild('anchorMenu') anchorMenu: ContextMenu;

  @Input() color?: string;
  @Input() topoImage: TopoImage;
  @Input() selectedLine?: Line;
  @Input() linePathDisplayNumber: number | null = null;
  @Input() path: number[] = [];
  @Input() tabuAreaIds: string[] = [];
  @Input() allTabuAreas: TabuArea[] = [];
  @Input() tabuInProgress: number[] = [];
  @Input() isDisabled = false;

  @Output() pathChange = new EventEmitter<number[]>();
  @Output() tabuAreaIdsChange = new EventEmitter<string[]>();
  @Output() allTabuAreasChange = new EventEmitter<TabuArea[]>();
  @Output() drawModeChange = new EventEmitter<DrawMode>();

  public linePath: LinePath;
  public anchorMenuItems: MenuItem[] = [];
  public drawMode: DrawMode = 'line';
  public inProgressVertices: number[] = [];

  private cdr = inject(ChangeDetectorRef);
  private translocoService = inject(TranslocoService);
  private store = inject(Store);
  private pendingAnchorIndex: number;

  /**
   * Initializes the anchor context menu and local editor state.
   */
  ngOnInit() {
    this.anchorMenuItems = [
      {
        label: this.translocoService.translate('linePathEditor.deleteAnchor'),
        icon: 'pi pi-trash',
        command: () => this.handleAnchorDelete(this.pendingAnchorIndex),
      },
    ];
    this.refreshData();
  }

  /**
   * Rebuilds editor state when the topo image or bound path/tabu state changes.
   * @param changes Angular input changes.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['topoImage'] && changes['topoImage'].firstChange) {
      this.refreshData(true);
      return;
    }
    if (changes['path'] || changes['tabuAreaIds'] || changes['selectedLine']) {
      this.syncLinePathFromInputs();
      this.topoImageComponent?.redrawLinePathInProgress();
    }
    if (changes['tabuInProgress'] && !changes['tabuInProgress'].firstChange) {
      this.setTabuInProgress([...(this.tabuInProgress ?? [])]);
    }
  }

  /**
   * Resets the in-progress line path while optionally forcing the topo image to re-render.
   * @param clear When true, briefly unmounts the topo image to work around sizing race conditions.
   */
  refreshData(clear = false) {
    const topoImageCache = this.topoImage;
    if (clear) {
      this.topoImage = null;
      this.cdr.detectChanges();
    }
    this.topoImage = topoImageCache;
    this.cdr.detectChanges();
    this.syncLinePathFromInputs();
    this.setTabuInProgress([...(this.tabuInProgress ?? [])]);
  }

  setDrawMode(mode: DrawMode) {
    if (this.drawMode === mode) {
      return;
    }
    this.drawMode = mode;
    if (this.topoImageComponent) {
      this.topoImageComponent.drawMode = mode;
      this.topoImageComponent.redrawLinePathInProgress();
    }
    this.drawModeChange.emit(mode);
  }

  getTabuInProgress(): number[] {
    return [...this.inProgressVertices];
  }

  /**
   * Appends a new anchor at the clicked image position.
   * @param point Absolute click coordinates on the topo canvas.
   */
  handleClick(point: number[]) {
    if (this.isDisabled) {
      return;
    }
    if (this.drawMode === 'tabu') {
      this.handleTabuClick(point);
      return;
    }
    this.linePath.path.push((point[0] / this.topoImageComponent.width) * 100);
    this.linePath.path.push((point[1] / this.topoImageComponent.height) * 100);
    this.topoImageComponent.redrawLinePathInProgress();
    this.emitPath();
  }

  /**
   * Inserts a new anchor on the clicked segment of the active path or tabu polygon.
   * @param event Segment hit with projected point and insertion index.
   */
  handleLineSegmentClick(event: { point: number[]; insertAfterIndex: number }) {
    if (this.isDisabled) {
      return;
    }
    if (this.drawMode === 'tabu') {
      return;
    }
    const insertAt = (event.insertAfterIndex + 1) * 2;
    this.linePath.path.splice(
      insertAt,
      0,
      (event.point[0] / this.topoImageComponent.width) * 100,
      (event.point[1] / this.topoImageComponent.height) * 100,
    );
    this.topoImageComponent.redrawLinePathInProgress();
    this.emitPath();
  }

  /**
   * Moves an anchor to a new position, or merges it with another anchor on the same line.
   * @param event Drag result with anchor index, new point, and optional merge target.
   */
  handleAnchorDrag(event: {
    index: number;
    point: number[];
    mergeWithIndex?: number;
  }) {
    if (this.isDisabled) {
      return;
    }
    if (this.drawMode === 'tabu') {
      const next = [...this.inProgressVertices];
      next[event.index * 2] =
        (event.point[0] / this.topoImageComponent.width) * 100;
      next[event.index * 2 + 1] =
        (event.point[1] / this.topoImageComponent.height) * 100;
      this.setTabuInProgress(next);
      return;
    }
    if (event.mergeWithIndex != null && this.linePath.path.length > 4) {
      // Merge into the other same-line anchor by removing the dragged one.
      this.linePath.path.splice(event.index * 2, 2);
    } else {
      this.linePath.path[event.index * 2] =
        (event.point[0] / this.topoImageComponent.width) * 100;
      this.linePath.path[event.index * 2 + 1] =
        (event.point[1] / this.topoImageComponent.height) * 100;
    }
    this.topoImageComponent.redrawLinePathInProgress();
    this.emitPath();
  }

  /**
   * Opens the anchor delete context menu when the path has more than two anchors.
   * @param event Anchor index and originating pointer event.
   */
  handleAnchorContextMenu(event: { index: number; originalEvent: MouseEvent }) {
    const minValues = this.drawMode === 'tabu' ? 6 : 4;
    const values =
      this.drawMode === 'tabu' ? this.inProgressVertices : this.linePath.path;
    if (this.isDisabled || values.length <= minValues) {
      return;
    }
    this.pendingAnchorIndex = event.index;
    this.anchorMenu.show(event.originalEvent);
  }

  /**
   * Removes an anchor from the active line path or tabu polygon.
   * @param index Zero-based anchor index.
   */
  handleAnchorDelete(index: number) {
    if (this.isDisabled) {
      return;
    }
    if (this.drawMode === 'tabu') {
      if (this.inProgressVertices.length > 6) {
        const next = [...this.inProgressVertices];
        next.splice(index * 2, 2);
        this.setTabuInProgress(next);
      }
      return;
    }
    if (this.linePath.path.length > 4) {
      this.linePath.path.splice(index * 2, 2);
      this.topoImageComponent.redrawLinePathInProgress();
      this.emitPath();
    }
  }

  finishTabuPolygon() {
    if (this.isDisabled || !isCompleteTabuPolygon(this.inProgressVertices)) {
      return;
    }
    if (tabuPolygonHasKinks(this.inProgressVertices)) {
      this.store.dispatch(toastNotification('TABU_HOLD_SELF_INTERSECTING'));
      return;
    }
    const area = createTabuArea(this.inProgressVertices);
    const nextAreas = [...cloneTabuAreas(this.allTabuAreas), area];
    this.setTabuInProgress([]);
    this.allTabuAreasChange.emit(nextAreas);
    if ((this.path?.length ?? 0) >= 4) {
      const nextIds = [...cloneTabuAreaIds(this.linePath.tabuAreaIds), area.id];
      this.linePath.tabuAreaIds = nextIds;
      this.tabuAreaIdsChange.emit(nextIds);
    }
  }

  canFinishTabuPolygon(): boolean {
    return (
      isCompleteTabuPolygon(this.inProgressVertices) &&
      !tabuPolygonHasKinks(this.inProgressVertices)
    );
  }

  /**
   * Removes the last anchor from the active line path or tabu polygon.
   */
  undo() {
    if (this.drawMode === 'tabu') {
      if (this.inProgressVertices.length >= 2) {
        this.setTabuInProgress(this.inProgressVertices.slice(0, -2));
      }
      return;
    }
    if (this.linePath.path.length >= 2) {
      this.linePath.path.pop();
      this.linePath.path.pop();
      this.topoImageComponent.redrawLinePathInProgress();
      this.emitPath();
    }
  }

  /**
   * Clears all anchors from the active line path.
   */
  restart() {
    if (this.drawMode !== 'line') {
      return;
    }
    this.linePath.path = [];
    this.topoImageComponent.redrawLinePathInProgress();
    this.emitPath();
  }

  private syncLinePathFromInputs() {
    if (!this.linePath) {
      this.linePath = new LinePath();
    }
    this.linePath.path = [...(this.path ?? [])];
    this.linePath.tabuAreaIds = cloneTabuAreaIds(this.tabuAreaIds);
    this.linePath.line = this.selectedLine;
  }

  private emitPath() {
    this.pathChange.emit([...(this.linePath.path ?? [])]);
  }

  private handleTabuClick(point: number[]) {
    if (this.shouldCloseTabuPolygon(point)) {
      this.finishTabuPolygon();
      return;
    }
    this.setTabuInProgress([
      ...this.inProgressVertices,
      (point[0] / this.topoImageComponent.width) * 100,
      (point[1] / this.topoImageComponent.height) * 100,
    ]);
  }

  /**
   * Updates in-progress tabu vertices and redraws immediately.
   * The canvas child only receives `[tabuInProgress]` on the next change-
   * detection pass, so we assign the input before redrawing or the new point
   * would appear one click late.
   */
  private setTabuInProgress(values: number[]) {
    this.inProgressVertices = values;
    if (!this.topoImageComponent) {
      return;
    }
    this.topoImageComponent.tabuInProgress = this.inProgressVertices;
    this.topoImageComponent.redrawLinePathInProgress();
  }

  private shouldCloseTabuPolygon(point: number[]): boolean {
    if (!isCompleteTabuPolygon(this.inProgressVertices)) {
      return false;
    }
    const first = getAbsoluteCoordinates(
      [this.inProgressVertices[0], this.inProgressVertices[1]],
      this.topoImageComponent.width,
      this.topoImageComponent.height,
    );
    const closeRadius = 14 * this.topoImageComponent.lineSizeMultiplicator;
    return Math.hypot(point[0] - first[0], point[1] - first[1]) <= closeRadius;
  }
}
