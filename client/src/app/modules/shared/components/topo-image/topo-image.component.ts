import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter, HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {TopoImage} from '../../../../models/topo-image';
import {ThumbnailWidths} from '../../../../enums/thumbnail-widths';
import {LinePath} from '../../../../models/line-path';
import {environment} from '../../../../../environments/environment';
import {debounceTime, fromEvent, timer} from 'rxjs';
import {Label, PointFeatureLabelPlacement} from './point-feature-label-placement';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Store} from '@ngrx/store';
import {selectIsMobile} from '../../../../ngrx/selectors/device.selectors';
import Konva from 'konva';

/**
 * Component that shows a topo image with line paths on it.
 */
@Component({
  selector: 'lc-topo-image',
  templateUrl: './topo-image.component.html',
  styleUrls: ['./topo-image.component.scss'],
  encapsulation: ViewEncapsulation.None
})
@UntilDestroy()
export class TopoImageComponent implements OnInit {

  @ViewChild('konvaContainer') konvaContainer: ElementRef;

  @Input() topoImage: TopoImage;
  @Input() linePathInProgress: LinePath = null;
  @Input() editorMode = false;
  @Input() showLineNumbers = false;

  @Output() anchorClick: EventEmitter<number[]> = new EventEmitter<number[]>();
  @Output() imageClick: EventEmitter<number[]> = new EventEmitter<number[]>();

  public loading = true;
  public skeletonWidth: number;
  public skeletonHeight: number;
  public width: number;
  public height: number;

  private backgroundImage: any;
  private lineLayer: Konva.Layer;
  private numberLayer: Konva.Layer;
  private stage: Konva.Stage;
  private lineSizeMultiplicator = 1;
  private scale: number = 1;
  private isMobile = false;

  constructor(private el: ElementRef,
              private store: Store) {
  }


  /**
   * Loads the background image and draws the lines on it.
   */
  ngOnInit() {
    this.store.select(selectIsMobile).subscribe(isMobile => {
      this.isMobile = isMobile;
      // I'm not sure why I need setTimeout here. Depending on the previous page, the parent container is not
      // sized according to the CSS rules which messes up the calculated sizes. Weird race condition which is
      // kind of solved by using a timeout...
      setTimeout(() => {
        this.render();
      })
      // Needs to be recalculated on window resize
      fromEvent(window, 'resize').pipe(debounceTime(50), untilDestroyed(this)).subscribe(() => {
        this.render();
      })
    });
  }

  render() {
    this.calculateSkeletonDimensionsAndSetImageSource();
    this.backgroundImage.onload = () => {
      this.drawLinesAndLabels();
    }
  }

  calculateSkeletonDimensionsAndSetImageSource() {
    this.backgroundImage = new Image();

    const containerWidth = this.el.nativeElement.offsetWidth;
    this.backgroundImage.src = this.topoImage.image.path;

    if (containerWidth <= ThumbnailWidths.XS) {
      this.skeletonWidth = ThumbnailWidths.XS;
      this.backgroundImage.src = this.topoImage.image.thumbnailXS;
    }
    if (containerWidth > ThumbnailWidths.XS && containerWidth <= ThumbnailWidths.S) {
      this.skeletonWidth = ThumbnailWidths.S;
      this.backgroundImage.src = this.topoImage.image.thumbnailS;
    }
    if (containerWidth > ThumbnailWidths.S && containerWidth <= ThumbnailWidths.M) {
      this.skeletonWidth = ThumbnailWidths.M;
      this.backgroundImage.src = this.topoImage.image.thumbnailM;
    }
    if (containerWidth > ThumbnailWidths.M && containerWidth <= ThumbnailWidths.XL) {
      this.skeletonWidth = ThumbnailWidths.L;
      this.backgroundImage.src = this.topoImage.image.thumbnailL;
    }
    if (containerWidth > ThumbnailWidths.L) {
      this.skeletonWidth = ThumbnailWidths.XL;
      this.backgroundImage.src = this.topoImage.image.thumbnailXL;
    }

    // Fit skeleton to parent container
    if (this.skeletonWidth > containerWidth) {
      this.skeletonWidth = containerWidth;
    }
    this.skeletonHeight = this.skeletonWidth * (this.topoImage.image.height / this.topoImage.image.width)
  }

  drawLinesAndLabels() {
    this.width = this.backgroundImage.width;
    this.height = this.backgroundImage.height;
    this.lineSizeMultiplicator = this.width / 350;
    this.loading = false;
    this.createKonvaStageAndLayer();
    const labels: Label[] = [];
    this.topoImage.linePaths.map((linePath, index) => {
      this.drawLine(linePath, this.linePathInProgress ? .3 : 1);
      if (this.showLineNumbers) {
        labels.push(this.getLineLabel(linePath, String(index + 1)));
      }
    });
    if (this.showLineNumbers && labels.length > 0) {
      const PFLP = new PointFeatureLabelPlacement(this.width, this.height, labels);
      PFLP.discreteGradientDescent();
      this.topoImage.linePaths.map((linePath, index) => {
        this.placeLineLabel(linePath, labels[index]);
      });
    }
    if (this.linePathInProgress) {
      this.drawLine(this.linePathInProgress, 1)
    }
    if (this.editorMode) {
      this.topoImage.linePaths.map(linePath => {
        this.drawAnchors(linePath);
      });
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
    this.lineLayer = new Konva.Layer();
    this.stage.add(this.lineLayer);
    this.numberLayer = new Konva.Layer();
    this.stage.add(this.numberLayer);
    const background = new Konva.Rect({
      width: this.width,
      height: this.height
    })
    background.fillPatternImage(this.backgroundImage);
    if (this.editorMode) {
      background.on('click', (event) => {
        console.log(event);
        event.cancelBubble = true;
        this.imageClick.emit([event.evt.offsetX * (1 / this.scale), event.evt.offsetY * (1 / this.scale)]);
      });
      background.on('touchstart', (event) => {
        event.cancelBubble = true;
        const rect = (event.evt.target as HTMLElement).getBoundingClientRect();
        const offsetX = event.evt.targetTouches[0].clientX - rect.left;
        const offsetY = event.evt.targetTouches[0].clientY - rect.top;
        this.imageClick.emit([offsetX * (1 / this.scale), offsetY * (1 / this.scale)]);
      });
      background.on('mouseenter', () => {
        this.stage.container().style.cursor = 'pointer';
      })
      background.on('mouseleave', () => {
        this.stage.container().style.cursor = 'default';
      })
    }
    this.fitStageIntoParentContainer();
    this.lineLayer.add(background)
  }

  /**
   * Draws a line path on the image.
   * @param linePath Line path to draw.
   * @param opacity Opacity of the line.
   */
  drawLine(linePath: LinePath, opacity: number) {
    const line = new Konva.Arrow({
      points: this.getAbsoluteCoordinates(linePath.path),
      stroke: environment.arrowColor,
      fill: environment.arrowColor,
      strokeWidth: 2 * this.lineSizeMultiplicator,
      lineCap: 'square',
      tension: 0,
      pointerLength: 6 * this.lineSizeMultiplicator,
      pointerWidth: 6 * this.lineSizeMultiplicator,
      opacity,
    });
    this.lineLayer.add(line);
    linePath.konvaLine = line;
  }

  /**
   * Places a label for the given line path on the canvas.
   * @param linePath Line path for which to place the label.
   * @param label Label to place.
   */
  placeLineLabel(linePath: LinePath, label: Label) {
    const rectangleGroup = new Konva.Group({
      x: label.position.x - (label.width / 2),
      y: label.position.y - (label.height / 2),
      width: label.width,
      height: label.height,
    });
    // Scale rect horizontally by its text content's length, but exclude padding
    const rectangle = new Konva.Rect({
      width: label.width,
      height: label.height,
      fill: environment.arrowColor,
      cornerRadius: label.height / 6
    });
    rectangleGroup.add(rectangle);
    const konvaText = new Konva.Text({
      text: label.text,
      fontSize: label.height / 1.2,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fill: environment.arrowTextColor,
      width: label.width,
      padding: label.height / 8,
      align: 'center'
    });
    rectangleGroup.add(konvaText);
    this.numberLayer.add(rectangleGroup);
    linePath.konvaRect = rectangle;
    linePath.konvaText = konvaText;
  }

  /**
   * Returns a label object for the given line path.
   * @param linePath Path to return label for.
   * @param text Label text.
   */
  getLineLabel(linePath: LinePath, text: string): Label {
    const absoluteCoordinates = this.getAbsoluteCoordinates([linePath.path[0], linePath.path[1]]);
    const rectSize = 11 * this.lineSizeMultiplicator;
    const rectWidth = rectSize * text.length - (text.length - 1) * 2 * rectSize / 8;
    return {
      position: {
        x: absoluteCoordinates[0],
        y: absoluteCoordinates[1],
      },
      width: rectWidth,
      height: rectSize,
      pointFeature: {
        x: absoluteCoordinates[0],
        y: absoluteCoordinates[1],
      },
      text
    }
  }

  /**
   * Draws line anchors in edit mode. Those anchors emit their positions via anchorClick when clicked on.
   * Thereby e.g. a sitstart line can be drawn 100% congruent to the standstart line.
   * @param linePath
   */
  drawAnchors(linePath: LinePath) {
    const anchorFactor = this.isMobile ? 1.5 : 1;
    const absoluteCoordinates = this.getAbsoluteCoordinates(linePath.path);
    for (let i = 0; i < absoluteCoordinates.length / 2; i++) {
      const anchor = new Konva.Circle({
        x: absoluteCoordinates[i * 2],
        y: absoluteCoordinates[i * 2 + 1],
        radius: 10 * anchorFactor,
        fill: environment.arrowColor,
        stroke: environment.arrowTextColor,
        strokeWidth: 1,
      });
      anchor.on('click', (event) => {
        event.cancelBubble = true;
        this.anchorClick.emit([absoluteCoordinates[i * 2], absoluteCoordinates[i * 2 + 1]])
      });
      anchor.on('tap', (event) => {
        event.cancelBubble = true;
        this.anchorClick.emit([absoluteCoordinates[i * 2], absoluteCoordinates[i * 2 + 1]])
      });
      anchor.on('mouseenter', () => {
        anchor.fill(environment.arrowHighlightColor);
        this.stage.container().style.cursor = 'pointer';
      })
      anchor.on('mouseleave', () => {
        anchor.fill(environment.arrowColor);
        this.stage.container().style.cursor = 'default';
      })
      this.lineLayer.add(anchor);
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
