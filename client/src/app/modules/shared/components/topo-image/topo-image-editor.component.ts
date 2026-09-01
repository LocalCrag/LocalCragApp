import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { LinePath } from '../../../../models/line-path';
import { Label } from './point-feature-label-placement';
import Konva from 'konva';
import { selectInstanceSettingsState } from '../../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { highlightColor } from '../../../../utility/misc/color';
import { Skeleton } from 'primeng/skeleton';
import {
  sortLinePathsByOrderIndex,
  getLinePathDisplayNumber,
} from '../../../../utility/topo/line-path-numbering';
import {
  getAbsoluteCoordinates,
  getClosestSegmentHit,
} from './topo-image-canvas.utils';
import { TopoImageCanvasBase } from './topo-image-canvas.base';

/**
 * Interactive topo image canvas for drawing and editing line paths.
 */
@Component({
  selector: 'lc-topo-image-editor',
  templateUrl: './topo-image.component.html',
  styleUrls: ['./topo-image.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [Skeleton],
})
export class TopoImageEditorComponent
  extends TopoImageCanvasBase
  implements OnChanges
{
  @Input() linePathInProgress: LinePath = null;
  /** 1-based display number for the line path currently being edited. */
  @Input() linePathInProgressNumber: number | null = null;

  @Output() anchorClick = new EventEmitter<number[]>();
  @Output() anchorDrag = new EventEmitter<{
    index: number;
    point: number[];
    mergeWithIndex?: number;
  }>();
  @Output() anchorContextMenu = new EventEmitter<{
    index: number;
    originalEvent: MouseEvent;
  }>();
  @Output() lineSegmentClick = new EventEmitter<{
    point: number[];
    insertAfterIndex: number;
  }>();
  @Output() imageClick = new EventEmitter<number[]>();

  private focusLayer: Konva.Layer;
  private anchorLayer: Konva.Layer;
  private editableAnchors: Konva.Circle[] = [];
  private magneticAnchorHighlight: Konva.Circle | null = null;

  /**
   * Re-renders the canvas when the topo image or active line path changes.
   * @param changes Angular input changes.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (!this.topoImage) {
      return;
    }
    const shouldRender =
      (changes['topoImage'] && !changes['topoImage'].firstChange) ||
      (changes['linePathInProgress'] &&
        !changes['linePathInProgress'].firstChange) ||
      changes['linePathInProgressNumber'];
    if (shouldRender) {
      setTimeout(() => this.render());
    }
  }

  /**
   * Builds the full editor canvas: existing paths (dimmed), number labels,
   * the in-progress path on the focus layer, magnetic anchors, and draggable anchors.
   */
  protected drawLinesAndLabels() {
    this.editableAnchors = [];
    this.clearMagneticAnchorHighlight();
    this.syncCanvasDimensionsFromImage();
    this.createKonvaStageAndLayer();

    const labels: Label[] = [];
    const orderedLinePaths = sortLinePathsByOrderIndex(
      this.topoImage.linePaths,
    );
    const backgroundOpacity = this.linePathInProgress ? 0.2 : 1;
    orderedLinePaths.forEach((linePath, index) => {
      this.drawLine(linePath, backgroundOpacity);
      labels.push(
        this.getLineLabel(linePath, getLinePathDisplayNumber(linePath, index)),
      );
    });

    this.placeLineLabels(orderedLinePaths, labels, true);

    if (this.linePathInProgress && this.linePathInProgress.path.length >= 4) {
      this.drawLine(this.linePathInProgress, 1, true, this.focusLayer);
      if (this.linePathInProgressNumber != null) {
        const inProgressLabel = this.getLineLabel(
          this.linePathInProgress,
          String(this.linePathInProgressNumber),
        );
        this.placeLineLabel(this.linePathInProgress, inProgressLabel, true);
      }
    }

    this.topoImage.linePaths.forEach((linePath) => {
      this.drawAnchors(linePath);
    });
    if (this.linePathInProgress && this.linePathInProgress.path.length >= 2) {
      this.drawEditableAnchors(this.linePathInProgress);
    }
  }

  /**
   * Creates the Konva stage with editor layers and wires background click/touch
   * handlers for placing new anchors.
   */
  private createKonvaStageAndLayer() {
    this.stage = new Konva.Stage({
      container: this.konvaContainer.nativeElement,
      width: this.width,
      height: this.height,
      preventDefault: true,
    });
    this.lineLayer = new Konva.Layer({ preventDefault: true });
    this.stage.add(this.lineLayer);
    this.numberLayer = new Konva.Layer({
      preventDefault: true,
      listening: false,
    });
    this.stage.add(this.numberLayer);
    this.focusLayer = new Konva.Layer({ preventDefault: true });
    this.stage.add(this.focusLayer);
    this.anchorLayer = new Konva.Layer();
    this.stage.add(this.anchorLayer);

    const background = new Konva.Rect({
      width: this.width,
      height: this.height,
      preventDefault: true,
    });
    background.fillPatternImage(this.backgroundImage);
    background.on('click', (event) => {
      event.cancelBubble = true;
      this.imageClick.emit([
        event.evt.offsetX * (1 / this.scale),
        event.evt.offsetY * (1 / this.scale),
      ]);
    });
    background.on('touchstart', (event) => {
      event.cancelBubble = true;
      const rect = (event.evt.target as HTMLElement).getBoundingClientRect();
      const offsetX = event.evt.targetTouches[0].clientX - rect.left;
      const offsetY = event.evt.targetTouches[0].clientY - rect.top;
      this.imageClick.emit([
        offsetX * (1 / this.scale),
        offsetY * (1 / this.scale),
      ]);
    });
    background.on('mouseenter', () => {
      this.stage.container().style.cursor = 'pointer';
    });
    this.fitStage();
    this.lineLayer.add(background);
  }

  /**
   * Draws a line path arrow on the canvas.
   * @param linePath Path to render.
   * @param opacity Line opacity (existing paths are dimmed while editing).
   * @param highlighted When true, uses the highlight color and enables segment-click insertion.
   * @param targetLayer Layer to draw on; defaults to the main line layer.
   */
  private drawLine(
    linePath: LinePath,
    opacity: number,
    highlighted = false,
    targetLayer?: Konva.Layer,
  ) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const baseColor =
          linePath.line?.color ??
          this.color ??
          instanceSettingsState.arrowColor;
        const strokeColor = highlighted
          ? instanceSettingsState.arrowHighlightColor
          : baseColor;
        const layer = targetLayer ?? this.lineLayer;
        const isActiveEditableLine = highlighted;
        const line = new Konva.Arrow({
          points: getAbsoluteCoordinates(
            linePath.path,
            this.width,
            this.height,
          ),
          stroke: strokeColor,
          fill: strokeColor,
          strokeWidth: 2 * this.lineSizeMultiplicator,
          lineCap: 'square',
          tension: 0,
          pointerLength: 6 * this.lineSizeMultiplicator,
          pointerWidth: 6 * this.lineSizeMultiplicator,
          opacity,
          listening: isActiveEditableLine,
          hitStrokeWidth: isActiveEditableLine ? 20 * this.mobileSizeFactor : 0,
          preventDefault: true,
        });
        if (isActiveEditableLine) {
          const emitSegmentClick = (event: Konva.KonvaEventObject<Event>) => {
            event.cancelBubble = true;
            const pointer = this.stage.getPointerPosition();
            if (!pointer) {
              return;
            }
            const point = [
              pointer.x * (1 / this.scale),
              pointer.y * (1 / this.scale),
            ];
            const segmentHit = getClosestSegmentHit(
              linePath.path,
              point,
              this.width,
              this.height,
              12 * this.mobileSizeFactor * this.lineSizeMultiplicator,
            );
            if (!segmentHit) {
              return;
            }
            this.lineSegmentClick.emit({
              point: segmentHit.point,
              insertAfterIndex: segmentHit.insertAfterIndex,
            });
          };
          line.on('click', emitSegmentClick);
          line.on('tap', emitSegmentClick);
          line.on('mouseenter', () => {
            this.stage.container().style.cursor = 'copy';
          });
          line.on('mouseleave', () => {
            this.stage.container().style.cursor = 'default';
          });
        }
        layer.add(line);
        linePath.konvaLine = line;
        linePath.konvaFocusLayer = this.focusLayer;
        linePath.konvaNumberLayer = this.numberLayer;
        linePath.konvaLineLayer = this.lineLayer;
      });
  }

  /**
   * Draws draggable anchors for the path being edited. Supports magnetic snapping,
   * long-press context menu on touch, and live line updates while dragging.
   * @param linePath The in-progress line path.
   */
  private drawEditableAnchors(linePath: LinePath) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const absoluteCoordinates = getAbsoluteCoordinates(
          linePath.path,
          this.width,
          this.height,
        );
        const snapRadius =
          15 * this.mobileSizeFactor * this.lineSizeMultiplicator;
        const canDeleteAnchor = linePath.path.length > 4;
        const anchorNodes: Konva.Circle[] = [];
        const activeAnchorColor = instanceSettingsState.arrowHighlightColor;

        const updateInProgressLine = () => {
          if (!linePath.konvaLine) {
            return;
          }
          const points: number[] = [];
          anchorNodes.forEach((anchorNode) => {
            points.push(anchorNode.x(), anchorNode.y());
          });
          linePath.konvaLine.points(points);
        };

        for (let i = 0; i < absoluteCoordinates.length / 2; i++) {
          const anchorIndex = i;
          const anchor = new Konva.Circle({
            x: absoluteCoordinates[i * 2],
            y: absoluteCoordinates[i * 2 + 1],
            radius: 10 * this.mobileSizeFactor,
            fill: activeAnchorColor,
            stroke: instanceSettingsState.arrowTextColor,
            strokeWidth: 2,
            draggable: true,
            hitStrokeWidth: 20,
            preventDefault: true,
          });

          let longPressTimer: ReturnType<typeof setTimeout> | null = null;
          let longPressTriggered = false;
          let touchStartPosition: { x: number; y: number } | null = null;

          const clearLongPress = () => {
            if (longPressTimer) {
              clearTimeout(longPressTimer);
              longPressTimer = null;
            }
            touchStartPosition = null;
          };

          const emitAnchorContextMenu = (originalEvent: Event) => {
            if (!canDeleteAnchor) {
              return;
            }
            originalEvent.preventDefault();
            let pageX = (originalEvent as MouseEvent).pageX;
            let pageY = (originalEvent as MouseEvent).pageY;
            if (
              (pageX == null || pageY == null) &&
              'touches' in originalEvent
            ) {
              const touchEvent = originalEvent as TouchEvent;
              const touch =
                touchEvent.touches[0] ?? touchEvent.changedTouches[0];
              pageX = touch?.pageX;
              pageY = touch?.pageY;
            }
            this.anchorContextMenu.emit({
              index: anchorIndex,
              originalEvent: {
                pageX,
                pageY,
                preventDefault: () => originalEvent.preventDefault(),
                stopPropagation: () => originalEvent.stopPropagation(),
              } as MouseEvent,
            });
          };

          anchor.on('dragstart', () => {
            clearLongPress();
            if (longPressTriggered) {
              anchor.stopDrag();
              longPressTriggered = false;
              return;
            }
            anchor.moveToTop();
          });

          anchor.on('dragmove', () => {
            clearLongPress();
            const snapTargets = this.getSnapTargets(linePath, anchorIndex);
            const snappedPosition = this.getSnappedPosition(
              anchor.x(),
              anchor.y(),
              snapTargets,
              snapRadius,
            );
            anchor.position(snappedPosition);
            updateInProgressLine();
          });

          anchor.on('dragend', () => {
            if (longPressTriggered) {
              longPressTriggered = false;
              return;
            }
            const snapTargets = this.getSnapTargets(linePath, anchorIndex);
            const snappedPosition = this.getSnappedPosition(
              anchor.x(),
              anchor.y(),
              snapTargets,
              snapRadius,
            );
            anchor.position(snappedPosition);
            const mergeWithIndex = this.getSameLineSnapAnchorIndex(
              linePath,
              anchorIndex,
              snappedPosition.x,
              snappedPosition.y,
              snapRadius,
            );
            this.anchorDrag.emit({
              index: anchorIndex,
              point: [snappedPosition.x, snappedPosition.y],
              mergeWithIndex:
                mergeWithIndex >= 0 && linePath.path.length > 4
                  ? mergeWithIndex
                  : undefined,
            });
          });

          anchor.on('contextmenu', (event) => {
            event.cancelBubble = true;
            emitAnchorContextMenu(event.evt);
          });

          anchor.on('touchstart', (event) => {
            longPressTriggered = false;
            const touch = event.evt.targetTouches?.[0];
            if (!touch || !canDeleteAnchor) {
              return;
            }
            touchStartPosition = { x: touch.clientX, y: touch.clientY };
            longPressTimer = setTimeout(() => {
              longPressTriggered = true;
              clearLongPress();
              anchor.position({
                x: absoluteCoordinates[anchorIndex * 2],
                y: absoluteCoordinates[anchorIndex * 2 + 1],
              });
              updateInProgressLine();
              anchor.stopDrag();
              emitAnchorContextMenu(event.evt);
            }, 500);
          });

          anchor.on('touchmove', (event) => {
            if (!touchStartPosition || !longPressTimer) {
              return;
            }
            const touch = event.evt.targetTouches?.[0];
            if (!touch) {
              return;
            }
            const movedDistance = Math.hypot(
              touch.clientX - touchStartPosition.x,
              touch.clientY - touchStartPosition.y,
            );
            if (movedDistance > 8) {
              clearLongPress();
            }
          });

          anchor.on('mouseenter', () => {
            this.stage.container().style.cursor = 'grab';
          });

          anchor.on('mouseleave', () => {
            this.stage.container().style.cursor = 'default';
          });

          anchor.on('mousedown', () => {
            this.stage.container().style.cursor = 'grabbing';
          });

          anchor.on('mouseup touchend touchcancel', () => {
            clearLongPress();
            this.stage.container().style.cursor = 'grab';
          });

          this.anchorLayer.add(anchor);
          anchorNodes.push(anchor);
          this.editableAnchors.push(anchor);
        }
      });
  }

  private destroyEditableAnchors() {
    this.editableAnchors.forEach((anchor) => anchor.destroy());
    this.editableAnchors = [];
  }

  /**
   * Collects absolute anchor positions from all line paths that a dragged anchor
   * can snap to. Excludes the anchor currently being moved.
   * @param excludeLinePath Line path being edited (its other anchors are still valid targets).
   * @param excludeAnchorIndex Index of the anchor being dragged, skipped for same-line targets.
   */
  private getSnapTargets(
    excludeLinePath?: LinePath,
    excludeAnchorIndex?: number,
  ): number[][] {
    const snapTargets: number[][] = [];
    const addPathTargets = (pathLine: LinePath, skipIndex?: number) => {
      const absoluteCoordinates = getAbsoluteCoordinates(
        pathLine.path,
        this.width,
        this.height,
      );
      for (let i = 0; i < absoluteCoordinates.length / 2; i++) {
        if (skipIndex === i) {
          continue;
        }
        snapTargets.push([
          absoluteCoordinates[i * 2],
          absoluteCoordinates[i * 2 + 1],
        ]);
      }
    };

    this.topoImage.linePaths.forEach((pathLine) => {
      addPathTargets(pathLine);
    });
    if (excludeLinePath && excludeLinePath.path.length >= 2) {
      addPathTargets(excludeLinePath, excludeAnchorIndex);
    }
    return snapTargets;
  }

  private getSnappedPosition(
    x: number,
    y: number,
    snapTargets: number[][],
    snapRadius: number,
  ): { x: number; y: number } {
    let closestTarget: number[] = null;
    let closestDistance = snapRadius;

    snapTargets.forEach((target) => {
      const distance = Math.hypot(x - target[0], y - target[1]);
      if (distance <= closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    });

    if (closestTarget) {
      return { x: closestTarget[0], y: closestTarget[1] };
    }

    return { x, y };
  }

  /**
   * Returns the index of another anchor on the same path that the given position
   * snaps onto, enabling merge-by-drag when two anchors coincide.
   * @returns Anchor index, or -1 if no snap target is within radius.
   */
  private getSameLineSnapAnchorIndex(
    linePath: LinePath,
    excludeAnchorIndex: number,
    x: number,
    y: number,
    snapRadius: number,
  ): number {
    const absoluteCoordinates = getAbsoluteCoordinates(
      linePath.path,
      this.width,
      this.height,
    );
    let closestIndex = -1;
    let closestDistance = snapRadius;

    for (let i = 0; i < absoluteCoordinates.length / 2; i++) {
      if (i === excludeAnchorIndex) {
        continue;
      }
      const distance = Math.hypot(
        x - absoluteCoordinates[i * 2],
        y - absoluteCoordinates[i * 2 + 1],
      );
      if (distance <= closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  /**
   * Draws click targets on existing line paths so a new path can start from
   * (or pass through) an existing anchor — e.g. a sit-start congruent to a stand-start.
   * @param linePath Existing line path whose anchors become magnetic snap points.
   */
  private drawAnchors(linePath: LinePath) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const absoluteCoordinates = getAbsoluteCoordinates(
          linePath.path,
          this.width,
          this.height,
        );
        const normalFill =
          linePath.line?.color ?? instanceSettingsState.arrowColor;
        const highlightFill =
          highlightColor(linePath.line?.color) ??
          instanceSettingsState.arrowHighlightColor;
        for (let i = 0; i < absoluteCoordinates.length / 2; i++) {
          const anchor = new Konva.Circle({
            x: absoluteCoordinates[i * 2],
            y: absoluteCoordinates[i * 2 + 1],
            radius: 10 * this.mobileSizeFactor,
            fill: normalFill,
            stroke: instanceSettingsState.arrowTextColor,
            strokeWidth: 1,
            preventDefault: true,
          });
          anchor.on('click', (event) => {
            event.cancelBubble = true;
            this.anchorClick.emit([
              absoluteCoordinates[i * 2],
              absoluteCoordinates[i * 2 + 1],
            ]);
          });
          anchor.on('tap', (event) => {
            event.cancelBubble = true;
            this.anchorClick.emit([
              absoluteCoordinates[i * 2],
              absoluteCoordinates[i * 2 + 1],
            ]);
          });
          anchor.on('mouseenter', () => {
            anchor.fill(highlightFill);
            this.showMagneticAnchorHighlight(anchor, highlightFill);
            this.stage.container().style.cursor = 'pointer';
          });
          anchor.on('mouseleave', () => {
            anchor.fill(normalFill);
            this.clearMagneticAnchorHighlight();
            this.stage.container().style.cursor = 'default';
          });
          this.lineLayer.add(anchor);
        }
      });
  }

  /**
   * Renders a non-interactive highlight copy on the anchor layer so anchors
   * hidden beneath number labels remain visibly highlighted on hover.
   */
  private showMagneticAnchorHighlight(source: Konva.Circle, fill: string) {
    this.clearMagneticAnchorHighlight();
    this.magneticAnchorHighlight = new Konva.Circle({
      x: source.x(),
      y: source.y(),
      radius: source.radius(),
      fill,
      stroke: source.stroke(),
      strokeWidth: source.strokeWidth(),
      listening: false,
    });
    this.anchorLayer.add(this.magneticAnchorHighlight);
    this.magneticAnchorHighlight.moveToTop();
  }

  private clearMagneticAnchorHighlight() {
    if (this.magneticAnchorHighlight) {
      this.magneticAnchorHighlight.destroy();
      this.magneticAnchorHighlight = null;
    }
  }

  /**
   * Redraws the line path currently being edited without a full canvas rebuild.
   */
  redrawLinePathInProgress() {
    if (!this.linePathInProgress) {
      return;
    }
    if (this.linePathInProgress.konvaLine) {
      this.linePathInProgress.konvaLine.destroy();
      this.linePathInProgress.konvaLine = null;
    }
    this.destroyEditableAnchors();
    if (this.linePathInProgress.path.length >= 4) {
      this.drawLine(this.linePathInProgress, 1, true, this.focusLayer);
    }
    if (this.anchorLayer && this.linePathInProgress.path.length >= 2) {
      this.drawEditableAnchors(this.linePathInProgress);
    }
  }
}
