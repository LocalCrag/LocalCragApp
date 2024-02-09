import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {TopoImage} from '../../../../models/topo-image';
import Konva from 'konva';
import {ThumbnailWidths} from '../../../../enums/thumbnail-widths';
import {LinePath} from '../../../../models/line-path';

/**
 * Component that shows a topo image with line paths on it.
 */
@Component({
  selector: 'lc-topo-image',
  templateUrl: './topo-image.component.html',
  styleUrls: ['./topo-image.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TopoImageComponent implements OnInit {

  @ViewChild('konvaContainer') konvaContainer: ElementRef;

  @Input() topoImage: TopoImage;
  @Input() linePathInProgress: LinePath = null;
  @Input() editorMode = false;

  @Output() anchorClick: EventEmitter<number[]> = new EventEmitter<number[]>();
  @Output() imageClick: EventEmitter<number[]> = new EventEmitter<number[]>();

  public loading = true;
  public width: number;
  public height: number;

  private backgroundImage: any;
  private stageLayer: Konva.Layer;
  private stage: Konva.Stage;
  private lineSizeMultiplicator = 1;
  private scale: number = 1;

  constructor(private el: ElementRef) {
  }

  /**
   * Loads the background image and draws the lines on it.
   */
  ngOnInit() {
    // Load the background image in the appropriate size and set line path size based on it
    this.backgroundImage = new Image();

    const containerWidth = this.el.nativeElement.offsetWidth;
    this.backgroundImage.src = this.topoImage.image.path;

    if (containerWidth <= ThumbnailWidths.XS) {
      this.backgroundImage.src = this.topoImage.image.thumbnailXS;
    }
    if (containerWidth > ThumbnailWidths.XS && containerWidth <= ThumbnailWidths.S) {
      this.backgroundImage.src = this.topoImage.image.thumbnailS;
    }
    if (containerWidth > ThumbnailWidths.S && containerWidth <= ThumbnailWidths.M) {
      this.backgroundImage.src = this.topoImage.image.thumbnailM;
    }
    if (containerWidth > ThumbnailWidths.M && containerWidth <= ThumbnailWidths.XL) {
      this.backgroundImage.src = this.topoImage.image.thumbnailL;
    }
    if (containerWidth > ThumbnailWidths.L) {
      this.backgroundImage.src = this.topoImage.image.thumbnailXL;
    }

    // Draw lines after image is fully loaded
    this.backgroundImage.onload = () => {
      this.width = this.backgroundImage.width;
      this.height = this.backgroundImage.height;
      this.lineSizeMultiplicator = this.width  / 350;
      this.loading = false;
      this.createKonvaStageAndLayer();
      this.topoImage.linePaths.map(linePath => {
        this.drawLine(linePath, this.linePathInProgress ? .3 : 1);
      })
      if (this.linePathInProgress) {
        this.drawLine(this.linePathInProgress, 1)
      }
      if (this.editorMode) {
        this.topoImage.linePaths.map(linePath => {
          this.drawAnchors(linePath);
        });
      }
    }
  }

  /**
   * Create the Konva stage and layer and add a rectangle containing the background image.
   */
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
    if (this.editorMode) {
      background.on('click', (event) => {
        event.cancelBubble = true;
        this.imageClick.emit([event.evt.offsetX * (1/this.scale), event.evt.offsetY * (1/this.scale)]);
      });
      background.on('mouseenter', () => {
        this.stage.container().style.cursor = 'pointer';
      })
      background.on('mouseleave', () => {
        this.stage.container().style.cursor = 'default';
      })
    }
    this.fitStageIntoParentContainer();
    this.stageLayer.add(background)
  }

  /**
   * Draws a line path oin the image.
   * @param linePath Line path to draw.
   * @param opacity Opacity of the line.
   */
  drawLine(linePath: LinePath, opacity: number) {
    const line = new Konva.Arrow({
      points: this.getAbsoluteCoordinates(linePath.path),
      stroke: 'yellow',
      fill: 'yellow',
      strokeWidth: 2 * this.lineSizeMultiplicator,
      lineCap: 'square',
      tension: 0,
      pointerLength: 6 * this.lineSizeMultiplicator,
      pointerWidth: 6 * this.lineSizeMultiplicator,
      opacity,
    });
    this.stageLayer.add(line);
    linePath.konvaLine = line;
  }

  /**
   * Draws line anchors in edit mode. Those anchors emit their positions via anchorClick when clicked on.
   * Thereby e.g. a sitstart line can be drawn 100% congruent to the standstart line.
   * @param linePath
   */
  drawAnchors(linePath: LinePath) {
    const absoluteCoordinates = this.getAbsoluteCoordinates(linePath.path);
    for (let i = 0; i < absoluteCoordinates.length / 2; i++) {
      const anchor = new Konva.Circle({
        x: absoluteCoordinates[i * 2],
        y: absoluteCoordinates[i * 2 + 1],
        radius: 10,
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 1,
      });
      anchor.on('click', (event) => {
        event.cancelBubble = true;
        this.anchorClick.emit([absoluteCoordinates[i * 2], absoluteCoordinates[i * 2 + 1]])
      });
      anchor.on('mouseenter', () => {
        anchor.fill('red');
        this.stage.container().style.cursor = 'pointer';
      })
      anchor.on('mouseleave', () => {
        anchor.fill('yellow');
        this.stage.container().style.cursor = 'default';
      })
      this.stageLayer.add(anchor);
    }
  }

  /**
   * Converts the relative coordinates (points array) to an array of absolute coordinate points based on the current
   * image size.
   * @param points
   */
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

  /**
   * Redraws the line in progress.
   */
  redrawLinePathInProgress() {
    this.linePathInProgress.konvaLine.destroy();
    this.drawLine(this.linePathInProgress, 1)
  }

  /**
   * Scales the stage, so it fits in the parent container.
   */
  fitStageIntoParentContainer() {
    const container = this.el.nativeElement
    const containerWidth = container.offsetWidth;
    this.scale = containerWidth / this.width;
    this.stage.width(this.width * this.scale);
    this.stage.height(this.height * this.scale);
    this.stage.scale({x: this.scale, y: this.scale});
  }

}