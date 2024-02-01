import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {TopoImage} from '../../../models/topo-image';
import Konva from 'konva';
import {ThumbnailSize} from '../../../enums/thumbnail-size';
import {LinePath} from '../../../models/line-path';

@Component({
  selector: 'lc-topo-image',
  templateUrl: './topo-image.component.html',
  styleUrls: ['./topo-image.component.scss']
})
export class TopoImageComponent implements OnInit {

  @ViewChild('konvaContainer') konvaContainer: ElementRef;

  @Input() topoImage: TopoImage;
  @Input() thumbnailSize: ThumbnailSize = ThumbnailSize.M;
  @Input() linePathInProgress: LinePath = null;

  public loading = true;
  public width: number;
  public height: number;

  private backgroundImage: any;
  private stageLayer: Konva.Layer;
  private stage: Konva.Stage;
  private lineSizeMultiplicator = 1;

  constructor(public el: ElementRef) {
  }

  ngOnInit() {
    this.backgroundImage = new Image();
    switch (this.thumbnailSize) {
      case ThumbnailSize.XS:
        this.backgroundImage.src = this.topoImage.image.thumbnailXS;
        this.lineSizeMultiplicator = .25;
        break;
      case ThumbnailSize.S:
        this.backgroundImage.src = this.topoImage.image.thumbnailS;
        this.lineSizeMultiplicator = .5;
        break;
      case ThumbnailSize.M:
        this.backgroundImage.src = this.topoImage.image.thumbnailM;
        this.lineSizeMultiplicator = 1;
        break;
      case ThumbnailSize.L:
        this.backgroundImage.src = this.topoImage.image.thumbnailL;
        this.lineSizeMultiplicator = 2;
        break;
      case ThumbnailSize.XL:
        this.backgroundImage.src = this.topoImage.image.thumbnailXL;
        this.lineSizeMultiplicator = 3;
        break;
      case ThumbnailSize.ORIGINAL:
        this.backgroundImage.src = this.topoImage.image.path;
        break;
    }
    this.backgroundImage.onload = () => {
      this.width = this.backgroundImage.width;
      this.height = this.backgroundImage.height;
      this.loading = false;
      this.createKonvaStageAndLayer();
      this.topoImage.linePaths.map(linePath => {
        this.drawLine(linePath, this.linePathInProgress ? .3 : 1);
      })
      if (this.linePathInProgress) {
        this.drawLine(this.linePathInProgress, 1)
      }
    }
  }

  createKonvaStageAndLayer() {
    this.stage = new Konva.Stage({
      container: this.konvaContainer.nativeElement,
      width: this.width,
      height: this.height,
    });
    this.stageLayer = new Konva.Layer();
    this.stage.add(this.stageLayer);
    const background = new Konva.Rect({
      width: this.width,
      height: this.height
    })
    background.fillPatternImage(this.backgroundImage);
    this.stageLayer.add(background)
  }

  drawLine(linePath: LinePath, opacity: number) {
    const line = new Konva.Arrow({
      points: this.getAbsoluteCoordinates(linePath.path),
      stroke: 'yellow',
      fill: 'yellow',
      strokeWidth: 2 * this.lineSizeMultiplicator,
      lineCap: 'square',
      tension: .5,
      pointerLength: 10 * this.lineSizeMultiplicator,
      pointerWidth: 10 * this.lineSizeMultiplicator,
      opacity,
    });
    this.stageLayer.add(line);
    linePath.konvaLine = line;
  }

  getAbsoluteCoordinates(points: number[]) {
    const absolutePoints = [];
    for (let i = 0; i < points.length; i++) {
      let divisor = this.height;
      if (i % 2 === 0) {
        divisor = this.width;
      }
      absolutePoints.push(Math.floor((points[i] / 100) * divisor));
    }
    return absolutePoints;
  }

  redraw() {
    this.linePathInProgress.konvaLine.destroy();
    this.drawLine(this.linePathInProgress, 1)
  }

}
