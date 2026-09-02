import {
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnInit,
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
  fitStageIntoParentContainer,
  getMobileSizeFactor,
} from './topo-image-canvas.utils';

/**
 * Shared Konva canvas lifecycle and drawing helpers for topo image components.
 */
@Directive()
export abstract class TopoImageCanvasBase implements OnInit {
  @ViewChild('konvaContainer') protected konvaContainer: ElementRef;

  @Input() topoImage: TopoImage;
  @Input() color?: string;

  public loading = true;
  public skeletonWidth: number;
  public skeletonHeight: number;
  public width: number;
  public height: number;

  protected backgroundImage: HTMLImageElement;
  protected lineLayer: Konva.Layer;
  protected numberLayer: Konva.Layer;
  protected stage: Konva.Stage;
  protected lineSizeMultiplicator = 1;
  protected scale = 1;
  protected isMobile = false;

  private resizeRenderSubject = new Subject<void>();
  private windowWidth: number;
  private destroyRef = inject(DestroyRef);
  protected el = inject(ElementRef);
  protected store = inject(Store);

  @HostListener('window:resize')
  onResize() {
    this.resizeRenderSubject.next();
  }

  ngOnInit() {
    setTimeout(() => this.render());
    this.windowWidth = window.innerWidth;
    this.resizeRenderSubject
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (window.innerWidth !== this.windowWidth) {
          this.render();
          this.windowWidth = window.innerWidth;
        }
      });
  }

  protected render() {
    this.store.select(selectIsMobile).subscribe((isMobile) => {
      this.isMobile = isMobile;
      this.loadBackgroundImage();
      this.backgroundImage.onload = () => this.drawLinesAndLabels();
    });
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
          ...(editorMode ? { listening: false, preventDefault: true } : {}),
        });
        const rectangle = new Konva.Rect({
          width: label.width,
          height: label.height,
          fill:
            linePath.line?.color ??
            this.color ??
            instanceSettingsState.arrowColor,
          cornerRadius: label.height / 6,
          ...(editorMode ? { preventDefault: true } : {}),
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
          ...(editorMode ? { preventDefault: true } : {}),
        });
        rectangleGroup.add(konvaText);
        this.numberLayer.add(rectangleGroup);
        linePath.konvaRect = rectangle;
        linePath.konvaText = konvaText;
        linePath.konvaNumberGroup = rectangleGroup;
      });
  }

  protected fitStage() {
    this.scale = fitStageIntoParentContainer(
      this.stage,
      this.el.nativeElement,
      this.width,
      this.height,
    );
  }

  private loadBackgroundImage() {
    const dimensions = calculateSkeletonDimensions(
      this.el.nativeElement.offsetWidth,
      this.topoImage,
    );
    this.skeletonWidth = dimensions.skeletonWidth;
    this.skeletonHeight = dimensions.skeletonHeight;
    this.backgroundImage = new Image();
    this.backgroundImage.src = dimensions.imageSrc;
  }
}
