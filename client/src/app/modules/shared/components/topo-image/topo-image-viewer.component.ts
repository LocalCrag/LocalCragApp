import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { LinePath } from '../../../../models/line-path';
import { Label } from './point-feature-label-placement';
import Konva from 'konva';
import { selectInstanceSettingsState } from '../../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { Skeleton } from 'primeng/skeleton';
import { getLinePathDisplayNumber } from '../../../../utility/topo/line-path-numbering';
import { linePathsForTopoCanvas } from '../../../../utility/topo/line-path-variants';
import { getAbsoluteCoordinates } from './topo-image-canvas.utils';
import { TopoImageCanvasBase } from './topo-image-canvas.base';

/**
 * Read-only topo image with drawn line paths and optional number labels.
 */
@Component({
  selector: 'lc-topo-image',
  templateUrl: './topo-image.component.html',
  styleUrls: ['./topo-image.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [Skeleton],
})
export class TopoImageViewerComponent
  extends TopoImageCanvasBase
  implements OnChanges
{
  @Input() showLineNumbers = false;
  /** When false, paths whose line is a variant are not drawn. */
  @Input() includeVariants = true;
  /** When `hover`, tabu polygons stay hidden until the matching line is highlighted. */
  @Input() tabuHoldsVisibility: 'always' | 'hover' = 'always';

  /** Layer used to bring a hovered line + label above others. */
  private focusLayer: Konva.Layer;

  ngOnChanges(changes: SimpleChanges) {
    const topoChanged =
      changes['topoImage'] && !changes['topoImage'].firstChange;
    const variantsChanged =
      changes['includeVariants'] && !changes['includeVariants'].firstChange;
    if (this.topoImage && (topoChanged || variantsChanged)) {
      setTimeout(() => this.render());
    }
  }

  protected drawLinesAndLabels() {
    this.syncCanvasDimensionsFromImage();
    this.createKonvaStageAndLayer();

    const labels: Label[] = [];
    const orderedLinePaths = linePathsForTopoCanvas(
      this.topoImage.linePaths,
      this.includeVariants,
    );
    orderedLinePaths.forEach((linePath, index) => {
      this.drawTabuHolds(linePath, {
        visible: this.tabuHoldsVisibility === 'always',
      });
      this.drawLine(linePath, 1);
      if (this.showLineNumbers) {
        labels.push(
          this.getLineLabel(
            linePath,
            getLinePathDisplayNumber(linePath, index),
          ),
        );
      }
    });

    if (this.showLineNumbers) {
      this.placeLineLabels(orderedLinePaths, labels, false);
    }
  }

  private createKonvaStageAndLayer() {
    this.destroyStage();
    // Allow page scroll over read-only topo canvases (Konva defaults to
    // preventDefault: true, which blocks touch/wheel scrolling).
    this.stage = new Konva.Stage({
      container: this.konvaContainer.nativeElement,
      width: this.width,
      height: this.height,
      preventDefault: false,
    });
    this.lineLayer = new Konva.Layer({ preventDefault: false });
    this.stage.add(this.lineLayer);
    this.numberLayer = new Konva.Layer({ preventDefault: false });
    this.stage.add(this.numberLayer);
    this.focusLayer = new Konva.Layer({ preventDefault: false });
    this.stage.add(this.focusLayer);

    const background = new Konva.Rect({
      width: this.width,
      height: this.height,
      preventDefault: false,
    });
    background.fillPatternImage(this.backgroundImage);
    this.fitStage();
    this.lineLayer.add(background);
  }

  private drawLine(linePath: LinePath, opacity: number) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const strokeColor =
          linePath.line?.color ??
          this.color ??
          instanceSettingsState.arrowColor;
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
          listening: false,
        });
        this.lineLayer.add(line);
        linePath.konvaLine = line;
        linePath.konvaFocusLayer = this.focusLayer;
        linePath.konvaNumberLayer = this.numberLayer;
        linePath.konvaLineLayer = this.lineLayer;
      });
  }
}
