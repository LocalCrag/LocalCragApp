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
import { sortLinePathsByOrderIndex } from '../../../../utility/topo/line-path-numbering';
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

  ngOnChanges(changes: SimpleChanges) {
    if (
      this.topoImage &&
      changes['topoImage'] &&
      !changes['topoImage'].firstChange
    ) {
      setTimeout(() => this.render());
    }
  }

  protected drawLinesAndLabels() {
    this.syncCanvasDimensionsFromImage();
    this.createKonvaStageAndLayer();

    const labels: Label[] = [];
    const orderedLinePaths = sortLinePathsByOrderIndex(
      this.topoImage.linePaths,
    );
    orderedLinePaths.forEach((linePath, index) => {
      this.drawLine(linePath, 1);
      if (this.showLineNumbers) {
        labels.push(this.getLineLabel(linePath, String(index + 1)));
      }
    });

    if (this.showLineNumbers) {
      this.placeLineLabels(orderedLinePaths, labels, false);
    }
  }

  private createKonvaStageAndLayer() {
    this.stage = new Konva.Stage({
      container: this.konvaContainer.nativeElement,
      width: this.width,
      height: this.height,
    });
    this.lineLayer = new Konva.Layer();
    this.stage.add(this.lineLayer);
    this.numberLayer = new Konva.Layer();
    this.stage.add(this.numberLayer);

    const background = new Konva.Rect({
      width: this.width,
      height: this.height,
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
        linePath.konvaNumberLayer = this.numberLayer;
        linePath.konvaLineLayer = this.lineLayer;
      });
  }
}
