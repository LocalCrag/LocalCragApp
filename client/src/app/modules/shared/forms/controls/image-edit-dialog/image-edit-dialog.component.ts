import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  NgZone,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw, lucideRotateCw } from '@ng-icons/lucide';
import { TranslocoDirective } from '@jsverse/transloco';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import {
  CropEdges,
  displaySize,
  FULL_CROP,
  rotatedPixelSize,
  ImageEditRequest,
  ImageRotation,
  isFullCrop,
  moveCrop,
  nextRotation,
  NormalizedCrop,
  resizeCrop,
  rotateCrop,
  toPixelCrop,
} from '../../../../../utility/image-edit';

type CropDragMode = 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

const HANDLE_EDGES: Record<Exclude<CropDragMode, 'move'>, CropEdges> = {
  n: { top: true },
  s: { bottom: true },
  e: { right: true },
  w: { left: true },
  nw: { top: true, left: true },
  ne: { top: true, right: true },
  sw: { bottom: true, left: true },
  se: { bottom: true, right: true },
};

@Component({
  selector: 'lc-image-edit-dialog',
  imports: [
    TranslocoDirective,
    NgIcon,
    HlmButton,
    HlmSpinner,
    HlmTooltip,
    ...HlmDialogImports,
  ],
  providers: [provideIcons({ lucideRotateCcw, lucideRotateCw })],
  templateUrl: './image-edit-dialog.component.html',
  styleUrl: './image-edit-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ImageEditDialogComponent implements OnChanges {
  @ViewChild('stage') stage?: ElementRef<HTMLElement>;

  @Input() visible = false;
  @Input() saving = false;
  @Input() imageUrl = '';
  @Input() imageWidth = 0;
  @Input() imageHeight = 0;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() applyEdit = new EventEmitter<ImageEditRequest>();

  public rotation: ImageRotation = 0;
  public crop: NormalizedCrop = { ...FULL_CROP };
  public viewWidth = 1;
  public viewHeight = 1;
  public readonly handles: Exclude<CropDragMode, 'move'>[] = [
    'n',
    's',
    'e',
    'w',
    'nw',
    'ne',
    'sw',
    'se',
  ];

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  private drag: {
    mode: CropDragMode;
    pointerId: number;
    start: NormalizedCrop;
    originX: number;
    originY: number;
  } | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['visible']?.currentValue === true &&
      !changes['visible'].previousValue
    ) {
      this.rotation = 0;
      this.crop = { ...FULL_CROP };
      this.drag = null;
    }
    if (this.visible) {
      this.updateViewSize();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.visible) {
      this.updateViewSize();
    }
  }

  get imageLayoutWidth(): number {
    return this.rotation === 90 || this.rotation === 270
      ? this.viewHeight
      : this.viewWidth;
  }

  get imageLayoutHeight(): number {
    return this.rotation === 90 || this.rotation === 270
      ? this.viewWidth
      : this.viewHeight;
  }

  rotateLeft(): void {
    this.rotate(-1);
  }

  rotateRight(): void {
    this.rotate(1);
  }

  reset(): void {
    if (this.saving) {
      return;
    }
    this.rotation = 0;
    this.crop = { ...FULL_CROP };
    this.updateViewSize();
  }

  cancel(): void {
    if (this.saving) {
      return;
    }
    this.visibleChange.emit(false);
  }

  apply(): void {
    if (this.saving || !this.imageWidth || !this.imageHeight) {
      return;
    }
    if (this.rotation === 0 && isFullCrop(this.crop)) {
      this.visibleChange.emit(false);
      return;
    }
    const pixelCrop = toPixelCrop(
      this.crop,
      this.imageWidth,
      this.imageHeight,
      this.rotation,
    );
    const rotated = rotatedPixelSize(
      this.imageWidth,
      this.imageHeight,
      this.rotation,
    );
    const coversFrame =
      pixelCrop.x === 0 &&
      pixelCrop.y === 0 &&
      pixelCrop.width === rotated.width &&
      pixelCrop.height === rotated.height;
    this.applyEdit.emit({
      rotation: this.rotation,
      crop: coversFrame ? null : pixelCrop,
    });
  }

  startMove(event: PointerEvent): void {
    this.startDrag(event, 'move');
  }

  startResize(
    event: PointerEvent,
    handle: Exclude<CropDragMode, 'move'>,
  ): void {
    this.startDrag(event, handle);
  }

  onStagePointerMove(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) {
      return;
    }
    const point = this.pointInStage(event);
    const dx = point.x - this.drag.originX;
    const dy = point.y - this.drag.originY;
    if (this.drag.mode === 'move') {
      this.crop = moveCrop(this.drag.start, dx, dy);
    } else {
      const min = this.minCropFraction();
      this.crop = resizeCrop(
        this.drag.start,
        dx,
        dy,
        HANDLE_EDGES[this.drag.mode],
        min.width,
        min.height,
      );
    }
    // Paint immediately. Captured pointer moves often run outside the dialog
    // view's change detection, so bindings would otherwise update only on release.
    this.paintCrop();
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  private paintCrop(): void {
    const stage = this.stage?.nativeElement;
    if (!stage) {
      return;
    }
    const { x, y, width, height } = this.crop;
    const pct = (value: number) => `${value * 100}%`;
    const set = (selector: string, styles: Partial<CSSStyleDeclaration>) => {
      const el = stage.querySelector(selector) as HTMLElement | null;
      if (el) {
        Object.assign(el.style, styles);
      }
    };
    set('.edit-stage__shade--top', { height: pct(y) });
    set('.edit-stage__shade--bottom', { top: pct(y + height) });
    set('.edit-stage__shade--left', {
      top: pct(y),
      height: pct(height),
      width: pct(x),
    });
    set('.edit-stage__shade--right', {
      top: pct(y),
      height: pct(height),
      left: pct(x + width),
    });
    set('.edit-stage__crop', {
      left: pct(x),
      top: pct(y),
      width: pct(width),
      height: pct(height),
    });
  }

  onStagePointerUp(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) {
      return;
    }
    this.drag = null;
  }

  private rotate(direction: 1 | -1): void {
    if (this.saving) {
      return;
    }
    this.crop = rotateCrop(this.crop, direction);
    this.rotation = nextRotation(this.rotation, direction);
    this.updateViewSize();
  }

  private startDrag(event: PointerEvent, mode: CropDragMode): void {
    if (this.saving || !this.stage) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const point = this.pointInStage(event);
    this.drag = {
      mode,
      pointerId: event.pointerId,
      start: { ...this.crop },
      originX: point.x,
      originY: point.y,
    };
    try {
      this.stage.nativeElement.setPointerCapture(event.pointerId);
    } catch {
      // The pointer is already gone, or this event cannot be captured.
    }
  }

  private pointInStage(event: PointerEvent): { x: number; y: number } {
    const rect = this.stage.nativeElement.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  private minCropFraction(): { width: number; height: number } {
    return {
      width: Math.min(0.5, 32 / Math.max(this.viewWidth, 1)),
      height: Math.min(0.5, 32 / Math.max(this.viewHeight, 1)),
    };
  }

  private updateViewSize(): void {
    const maxWidth = Math.max(240, Math.min(640, window.innerWidth - 80));
    const maxHeight = Math.max(180, Math.min(480, window.innerHeight - 240));
    const size = displaySize(
      this.imageWidth,
      this.imageHeight,
      this.rotation,
      maxWidth,
      maxHeight,
    );
    this.viewWidth = size.width;
    this.viewHeight = size.height;
  }
}
