import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { TopoImage } from '../../../../models/topo-image';
import { ThumbnailWidths } from '../../../../enums/thumbnail-widths';
import { LinePath } from '../../../../models/line-path';
import { debounceTime, Subject } from 'rxjs';
import {
  Label,
  PointFeatureLabelPlacement,
} from './point-feature-label-placement';

import { Store } from '@ngrx/store';
import { selectIsMobile } from '../../../../ngrx/selectors/device.selectors';
import Konva from 'konva';
import { selectInstanceSettingsState } from '../../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { highlightColor, textColor } from '../../../../utility/misc/color';
import { Skeleton } from 'primeng/skeleton';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component that shows a topo image with line paths on it.
 */
@Component({
  selector: 'lc-topo-image',
  templateUrl: './topo-image.component.html',
  styleUrls: ['./topo-image.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [Skeleton],
})
export class TopoImageComponent implements OnInit {
  @ViewChild('konvaContainer') konvaContainer: ElementRef;

  @Input() topoImage: TopoImage;
  @Input() linePathInProgress: LinePath = null;
  @Input() editorMode = false;
  @Input() showLineNumbers = false;
  @Input() color?: string; // Auxiliary color if topoImage.linePaths[i].line is not set

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
  private focusLayer: Konva.Layer;
  private stage: Konva.Stage;
  private lineSizeMultiplicator = 1;
  private scale: number = 1;
  private isMobile = false;
  private resizeRenderSubject = new Subject<any>();
  private windowWidth: number;
  private destroyRef = inject(DestroyRef);
  private el = inject(ElementRef);
  private store = inject(Store);

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeRenderSubject.next(null);
  }

  /**
   * Loads the background image and draws the lines on it.
   */
  ngOnInit() {
    // I'm not sure why I need setTimeout here. Depending on the previous page, the parent container is not
    // sized according to the CSS rules which messes up the calculated sizes. Weird race condition which is
    // kind of solved by using a timeout...
    setTimeout(() => {
      this.render();
    });
    // Needs to be recalculated on window resize - fast back and forth changes shouldn't trigger anything, thats
    // Why we check for window.innerWidth changes.
    this.windowWidth = window.innerWidth;
    this.resizeRenderSubject
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (window.innerWidth != this.windowWidth) {
          this.render();
          this.windowWidth = window.innerWidth;
        }
      });
  }

  render() {
    this.store.select(selectIsMobile).subscribe((isMobile) => {
      this.isMobile = isMobile;
      this.calculateSkeletonDimensionsAndSetImageSource();
      this.backgroundImage.onload = () => {
        this.drawLinesAndLabels();
      };
    });
  }

  calculateSkeletonDimensionsAndSetImageSource() {
    this.backgroundImage = new Image();

    const containerWidth = this.el.nativeElement.offsetWidth;
    this.backgroundImage.src = this.topoImage.image.path;

    if (containerWidth <= ThumbnailWidths.XS) {
      this.skeletonWidth = ThumbnailWidths.XS;
      this.backgroundImage.src = this.topoImage.image.thumbnailXS;
    }
    if (
      containerWidth > ThumbnailWidths.XS &&
      containerWidth <= ThumbnailWidths.S
    ) {
      this.skeletonWidth = ThumbnailWidths.S;
      this.backgroundImage.src = this.topoImage.image.thumbnailS;
    }
    if (
      containerWidth > ThumbnailWidths.S &&
      containerWidth <= ThumbnailWidths.M
    ) {
      this.skeletonWidth = ThumbnailWidths.M;
      this.backgroundImage.src = this.topoImage.image.thumbnailM;
    }
    if (
      containerWidth > ThumbnailWidths.M &&
      containerWidth <= ThumbnailWidths.XL
    ) {
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
    this.skeletonHeight =
      this.skeletonWidth *
      (this.topoImage.image.height / this.topoImage.image.width);
  }

  drawLinesAndLabels() {
    this.width = this.backgroundImage.width;
    this.height = this.backgroundImage.height;
    this.lineSizeMultiplicator = this.width / 350;
    this.loading = false;
    this.createKonvaStageAndLayer();
    const labels: Label[] = [];
    this.topoImage.linePaths.map((linePath, index) => {
      this.drawLine(linePath, this.linePathInProgress ? 0.3 : 1);
      if (this.showLineNumbers) {
        labels.push(this.getLineLabel(linePath, String(index + 1)));
      }
    });
    if (this.showLineNumbers && labels.length > 0) {
      const PFLP = new PointFeatureLabelPlacement(
        this.width,
        this.height,
        labels,
      );
      PFLP.discreteGradientDescent();
      this.topoImage.linePaths.map((linePath, index) => {
        this.placeLineLabel(linePath, labels[index]);
      });
    }
    if (this.linePathInProgress) {
      this.drawLine(this.linePathInProgress, 1);
    }
    if (this.editorMode) {
      this.topoImage.linePaths.map((linePath) => {
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
      preventDefault: this.editorMode,
    });
    this.lineLayer = new Konva.Layer({ preventDefault: this.editorMode });
    this.stage.add(this.lineLayer);
    this.numberLayer = new Konva.Layer({ preventDefault: this.editorMode });
    this.stage.add(this.numberLayer);
    this.focusLayer = new Konva.Layer({ preventDefault: this.editorMode });
    this.stage.add(this.focusLayer);
    const background = new Konva.Rect({
      width: this.width,
      height: this.height,
      preventDefault: this.editorMode,
    });
    background.fillPatternImage(this.backgroundImage);
    if (this.editorMode) {
      for (const layer of [background, this.lineLayer]) {
        layer.on('click', (event) => {
          event.cancelBubble = true;
          this.imageClick.emit([
            event.evt.offsetX * (1 / this.scale),
            event.evt.offsetY * (1 / this.scale),
          ]);
        });
        layer.on('touchstart', (event) => {
          event.cancelBubble = true;
          const rect = (
            event.evt.target as HTMLElement
          ).getBoundingClientRect();
          const offsetX = event.evt.targetTouches[0].clientX - rect.left;
          const offsetY = event.evt.targetTouches[0].clientY - rect.top;
          this.imageClick.emit([
            offsetX * (1 / this.scale),
            offsetY * (1 / this.scale),
          ]);
        });
        layer.on('mouseenter', () => {
          this.stage.container().style.cursor = 'pointer';
        });
      }
    }
    this.fitStageIntoParentContainer();
    this.lineLayer.add(background);
  }

  /**
   * Draws a line path on the image.
   * @param linePath Line path to draw.
   * @param opacity Opacity of the line.
   */
  drawLine(linePath: LinePath, opacity: number) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const line = new Konva.Arrow({
          points: this.getAbsoluteCoordinates(linePath.path),
          stroke:
            linePath.line?.color ??
            this.color ??
            instanceSettingsState.arrowColor,
          fill:
            linePath.line?.color ??
            this.color ??
            instanceSettingsState.arrowColor,
          strokeWidth: 2 * this.lineSizeMultiplicator,
          lineCap: 'square',
          tension: 0,
          pointerLength: 6 * this.lineSizeMultiplicator,
          pointerWidth: 6 * this.lineSizeMultiplicator,
          opacity,
          preventDefault: this.editorMode,
        });
        this.lineLayer.add(line);
        linePath.konvaLine = line;
        linePath.konvaFocusLayer = this.focusLayer;
        linePath.konvaNumberLayer = this.numberLayer;
        linePath.konvaLineLayer = this.lineLayer;
      });
  }

  /**
   * Places a label for the given line path on the canvas.
   * @param linePath Line path for which to place the label.
   * @param label Label to place.
   */
  placeLineLabel(linePath: LinePath, label: Label) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const rectangleGroup = new Konva.Group({
          x: label.position.x - label.width / 2,
          y: label.position.y - label.height / 2,
          width: label.width,
          height: label.height,
          preventDefault: this.editorMode,
        });
        // Scale rect horizontally by its text content's length, but exclude padding
        const rectangle = new Konva.Rect({
          width: label.width,
          height: label.height,
          fill:
            linePath.line?.color ??
            this.color ??
            instanceSettingsState.arrowColor,
          cornerRadius: label.height / 6,
          preventDefault: this.editorMode,
        });
        rectangleGroup.add(rectangle);
        const konvaText = new Konva.Text({
          text: label.text,
          fontSize: label.height / 1.2,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fill:
            textColor(linePath.line?.color ?? this.color) ??
            instanceSettingsState.arrowTextColor,
          width: label.width,
          padding: label.height / 8,
          align: 'center',
          preventDefault: this.editorMode,
        });
        rectangleGroup.add(konvaText);
        this.numberLayer.add(rectangleGroup);
        linePath.konvaRect = rectangle;
        linePath.konvaText = konvaText;
        linePath.konvaNumberGroup = rectangleGroup;
      });
  }

  /**
   * Returns a label object for the given line path.
   * @param linePath Path to return label for.
   * @param text Label text.
   */
  getLineLabel(linePath: LinePath, text: string): Label {
    const absoluteCoordinates = this.getAbsoluteCoordinates([
      linePath.path[0],
      linePath.path[1],
    ]);
    const rectSize = 11 * this.lineSizeMultiplicator;
    const rectWidth =
      rectSize * text.length - ((text.length - 1) * 2 * rectSize) / 8;
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
      text,
    };
  }

  /**
   * Draws line anchors in edit mode. Those anchors emit their positions via anchorClick when clicked on.
   * Thereby e.g. a sitstart line can be drawn 100% congruent to the standstart line.
   * @param linePath
   */
  drawAnchors(linePath: LinePath) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const anchorFactor = this.isMobile ? 1.5 : 1;
        const absoluteCoordinates = this.getAbsoluteCoordinates(linePath.path);
        for (let i = 0; i < absoluteCoordinates.length / 2; i++) {
          const anchor = new Konva.Circle({
            x: absoluteCoordinates[i * 2],
            y: absoluteCoordinates[i * 2 + 1],
            radius: 10 * anchorFactor,
            fill: linePath.line?.color ?? instanceSettingsState.arrowColor,
            stroke: instanceSettingsState.arrowTextColor,
            strokeWidth: 1,
            preventDefault: this.editorMode,
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
            anchor.fill(
              highlightColor(linePath.line?.color) ??
                instanceSettingsState.arrowHighlightColor,
            );
            this.stage.container().style.cursor = 'pointer';
          });
          anchor.on('mouseleave', () => {
            anchor.fill(
              linePath.line?.color ?? instanceSettingsState.arrowColor,
            );
            this.stage.container().style.cursor = 'default';
          });
          this.lineLayer.add(anchor);
        }
      });
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
    this.drawLine(this.linePathInProgress, 1);
  }

  /**
   * Scales the stage, so it fits in the parent container.
   */
  fitStageIntoParentContainer() {
    const container = this.el.nativeElement;
    const containerWidth = container.offsetWidth;
    this.scale = containerWidth / this.width;
    this.stage.width(this.width * this.scale);
    this.stage.height(this.height * this.scale);
    this.stage.scale({ x: this.scale, y: this.scale });
  }
}
