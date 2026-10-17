import {
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import Konva from 'konva';
import { take } from 'rxjs/operators';
import { TopoImage } from '../../../../models/topo-image';
import { LinePath } from '../../../../models/line-path';
import { selectIsMobile } from '../../../../ngrx/selectors/device.selectors';
import { selectInstanceSettingsState } from '../../../../ngrx/selectors/instance-settings.selectors';
import { textColor } from '../../../../utility/misc/color';
import {
  Label,
  PointFeatureLabelPlacement,
} from './point-feature-label-placement';
import {
  calculateSkeletonDimensions,
  createLineLabel,
  createTabuPolygon,
  fitStageIntoParentContainer,
  getMobileSizeFactor,
} from './topo-image-canvas.utils';
import {
  isCompleteTabuPolygon,
  resolveTabuPolygons,
} from '../../../../utility/topo/tabu-holds';
import {
  fullSizeTopoImageSrc,
  stageScaleToFit,
  topoPreviewMaxSize,
} from '../../../../utility/topo/topo-image-preview';

/**
 * Shared Konva canvas lifecycle and drawing helpers for topo image components.
 */
@Directive()
export abstract class TopoImageCanvasBase implements OnInit, OnDestroy {
  @ViewChild('konvaContainer') protected konvaContainer: ElementRef;

  @Input() topoImage: TopoImage;
  @Input() color?: string;
  /**
   * Click opens a full-size view. Only the line detail page sets this;
   * list thumbnails stay inert so their row link can navigate.
   */
  @Input() expandable = false;
  @Input() expandLabel = '';
  /** Draw at viewport size from the XL image instead of fitting the column. */
  @Input() viewportFit = false;
  @Output() expand = new EventEmitter<void>();

  @HostBinding('class.topo-image--expandable')
  get topoImageExpandableClass(): boolean {
    return this.expandable;
  }

  @HostBinding('class.topo-image--viewport-fit')
  get topoImageViewportFitClass(): boolean {
    return this.viewportFit;
  }

  public loading = true;
  public skeletonWidth: number;
  public skeletonHeight: number;
  public width: number;
  public height: number;

  protected backgroundImage: HTMLImageElement;
  protected lineLayer: Konva.Layer;
  protected numberLayer: Konva.Layer;
  protected stage: Konva.Stage;
  lineSizeMultiplicator = 1;
  protected scale = 1;
  protected isMobile = false;

  private resizeRenderSubject = new Subject<void>();
  private windowWidth: number;
  /** Container width of the last draw, so a parent resize can redraw too. */
  private renderedContainerWidth = -1;
  /**
   * Identifies the render whose photo is allowed to draw.
   * The image loads asynchronously, so a callback from an older render must
   * not draw after a resize, an image change, or destroy.
   */
  private renderGeneration = 0;
  private layoutWait: ResizeObserver | null = null;
  private destroyRef = inject(DestroyRef);
  protected el = inject(ElementRef);
  protected store = inject(Store);

  @HostListener('window:resize')
  onResize() {
    this.resizeRenderSubject.next();
  }

  /**
   * Redraws after the parent container size changes without a window resize.
   */
  relayout(): void {
    this.resizeRenderSubject.next();
  }

  ngOnInit() {
    setTimeout(() => this.render());
    this.windowWidth = window.innerWidth;
    this.resizeRenderSubject
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const containerWidth = (this.el.nativeElement as HTMLElement)
          .offsetWidth;
        const viewportChanged = window.innerWidth !== this.windowWidth;
        const containerChanged =
          containerWidth > 0 && containerWidth !== this.renderedContainerWidth;
        if (!viewportChanged && !containerChanged) {
          return;
        }
        this.render();
        this.windowWidth = window.innerWidth;
      });
  }

  ngOnDestroy() {
    this.stopWaitingForLayout();
    this.renderGeneration++;
    this.destroyStage();
  }

  /**
   * Starts a draw and ignores it if a newer render begins before the photo loads.
   */
  protected render() {
    const generation = ++this.renderGeneration;
    const containerWidth = (this.el.nativeElement as HTMLElement).offsetWidth;
    if (!this.viewportFit && containerWidth <= 0) {
      this.waitForLayout(generation);
      return;
    }
    this.renderedContainerWidth = containerWidth;
    this.stopWaitingForLayout();
    this.store
      .select(selectIsMobile)
      .pipe(take(1))
      .subscribe((isMobile) => {
        if (generation !== this.renderGeneration) {
          return;
        }
        this.isMobile = isMobile;
        this.loadBackgroundImage();
        this.backgroundImage.onload = () => {
          if (generation !== this.renderGeneration) {
            return;
          }
          this.drawLinesAndLabels();
        };
      });
  }

  /**
   * Step panels and flex columns often report 0 width on the first tick.
   * Choosing a thumbnail then locks in the 20px file.
   */
  private waitForLayout(generation: number) {
    const element = this.el.nativeElement as HTMLElement;
    this.stopWaitingForLayout();
    this.layoutWait = new ResizeObserver(() => {
      if (generation !== this.renderGeneration) {
        this.stopWaitingForLayout();
        return;
      }
      if (element.offsetWidth > 0) {
        this.stopWaitingForLayout();
        this.render();
      }
    });
    this.layoutWait.observe(element);
  }

  private stopWaitingForLayout() {
    this.layoutWait?.disconnect();
    this.layoutWait = null;
  }

  protected destroyStage() {
    if (!this.stage) {
      return;
    }
    this.stage.destroy();
    this.stage = null;
  }

  protected abstract drawLinesAndLabels(): void;

  protected syncCanvasDimensionsFromImage() {
    this.width = this.backgroundImage.width;
    this.height = this.backgroundImage.height;
    this.lineSizeMultiplicator = this.width / 350;
    this.loading = false;
  }

  protected get mobileSizeFactor(): number {
    return getMobileSizeFactor(this.isMobile);
  }

  protected getLineLabel(linePath: LinePath, text: string): Label {
    return createLineLabel(
      linePath,
      text,
      this.width,
      this.height,
      this.lineSizeMultiplicator,
      this.isMobile,
    );
  }

  protected placeLineLabels(
    orderedLinePaths: LinePath[],
    labels: Label[],
    editorMode: boolean,
  ) {
    if (labels.length === 0) {
      return;
    }
    const PFLP = new PointFeatureLabelPlacement(
      this.width,
      this.height,
      labels,
    );
    PFLP.discreteGradientDescent();
    orderedLinePaths.forEach((linePath, index) => {
      this.placeLineLabel(linePath, labels[index], editorMode);
    });
  }

  protected placeLineLabel(
    linePath: LinePath,
    label: Label,
    editorMode: boolean,
  ) {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(take(1))
      .subscribe((instanceSettingsState) => {
        const rectangleGroup = new Konva.Group({
          x: label.position.x - label.width / 2,
          y: label.position.y - label.height / 2,
          width: label.width,
          height: label.height,
          ...(editorMode
            ? { listening: false, preventDefault: true }
            : { preventDefault: false }),
        });
        const rectangle = new Konva.Rect({
          width: label.width,
          height: label.height,
          fill:
            linePath.line?.color ??
            this.color ??
            instanceSettingsState.arrowColor,
          cornerRadius: label.height / 6,
          preventDefault: editorMode,
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
          preventDefault: editorMode,
        });
        rectangleGroup.add(konvaText);
        this.numberLayer.add(rectangleGroup);
        linePath.konvaRect = rectangle;
        linePath.konvaText = konvaText;
        linePath.konvaNumberGroup = rectangleGroup;
      });
  }

  protected fitStage() {
    if (this.viewportFit) {
      const box = topoPreviewMaxSize(window.innerWidth, window.innerHeight);
      this.scale = stageScaleToFit(
        this.width,
        this.height,
        box.width,
        box.height,
      );
      this.stage.width(this.width * this.scale);
      this.stage.height(this.height * this.scale);
      this.stage.scale({ x: this.scale, y: this.scale });
      return;
    }
    this.scale = fitStageIntoParentContainer(
      this.stage,
      this.el.nativeElement,
      this.width,
      this.height,
    );
  }

  protected drawTabuHolds(
    linePath: LinePath,
    options: {
      visible: boolean;
      opacity?: number;
      targetLayer?: Konva.Layer;
    },
  ) {
    this.destroyTabuHolds(linePath);
    if (!linePath) {
      return;
    }
    const layer = options.targetLayer ?? this.lineLayer;
    const shapes: Konva.Line[] = [];
    resolveTabuPolygons(
      linePath.tabuAreaIds,
      this.topoImage?.tabuAreas,
    ).forEach((polygon) => {
      if (!isCompleteTabuPolygon(polygon)) {
        return;
      }
      const shape = createTabuPolygon(polygon, this.width, this.height, {
        closed: true,
        listening: false,
        opacity: options.opacity ?? 1,
        lineSizeMultiplicator: this.lineSizeMultiplicator,
      });
      shape.visible(options.visible);
      layer.add(shape);
      shapes.push(shape);
    });
    linePath.konvaTabuShapes = shapes;
    linePath.tabuHoldsHiddenUntilHover = !options.visible;
  }

  protected destroyTabuHolds(linePath: LinePath) {
    linePath?.konvaTabuShapes?.forEach((shape) => shape.destroy());
    if (linePath) {
      linePath.konvaTabuShapes = [];
    }
  }

  private loadBackgroundImage() {
    this.backgroundImage = new Image();
    if (this.viewportFit) {
      const image = this.topoImage.image;
      const box = topoPreviewMaxSize(window.innerWidth, window.innerHeight);
      const scale = stageScaleToFit(
        image.width || box.width,
        image.height || box.height,
        box.width,
        box.height,
      );
      this.skeletonWidth = (image.width || box.width) * scale;
      this.skeletonHeight = (image.height || box.height) * scale;
      this.backgroundImage.src = fullSizeTopoImageSrc(image);
      return;
    }
    const dimensions = calculateSkeletonDimensions(
      this.el.nativeElement.offsetWidth,
      this.topoImage,
    );
    this.skeletonWidth = dimensions.skeletonWidth;
    this.skeletonHeight = dimensions.skeletonHeight;
    this.backgroundImage.src = dimensions.imageSrc;
  }
}
