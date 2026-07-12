import {
  Component,
  ElementRef,
  forwardRef,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { ApiService } from '../../../../../services/core/api.service';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
} from '@angular/forms';
import { File } from '../../../../../models/file';
import { FileUpload } from 'primeng/fileupload';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../../../ngrx/selectors/instance-settings.selectors';
import { TranslocoDirective } from '@jsverse/transloco';

import { ProgressBar } from 'primeng/progressbar';
import { Image } from 'primeng/image';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {
  clampImageFocusY,
  computeFocusFrameRect,
  DEFAULT_IMAGE_FOCUS_Y,
  FocusFrameRect,
  ImageFocusY,
  normalizeImageFocusY,
} from '../../../../../utility/image-focus';

/**
 * A media upload component.
 */
@Component({
  selector: 'lc-single-image-upload',
  templateUrl: './single-image-upload.component.html',
  styleUrls: ['./single-image-upload.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SingleImageUploadComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    FileUpload,
    ProgressBar,
    Image,
    Button,
    TooltipModule,
  ],
})
export class SingleImageUploadComponent
  implements OnInit, ControlValueAccessor, OnDestroy
{
  @ViewChild(FileUpload) uploader: FileUpload;
  @ViewChild('focusStage') focusStage?: ElementRef<HTMLElement>;

  @Input() focusAdjustable = false;

  public uploadUrl: string;
  public isDisabled = false;
  public formControl: NgControl;
  public file: File;
  public imageLoading = true;
  public imageLoadingError = false;
  public progress: number = null;
  public progressMode: 'determinate' | 'indeterminate' = 'determinate';
  public showProgressBar = false;
  public maxImageSize: number;
  public focusAdjustActive = false;
  public focusY: ImageFocusY = DEFAULT_IMAGE_FOCUS_Y;
  public focusFrame: FocusFrameRect | null = null;
  public focusDragging = false;

  private api = inject(ApiService);
  private inj = inject(Injector);
  private store = inject(Store);
  private persistedFocusY: ImageFocusY | null = null;

  /**
   * Initializes the uploader component.
   */
  ngOnInit() {
    this.uploadUrl = this.api.uploader.uploadFile();
    this.formControl = this.inj.get(NgControl);
    this.store.select(selectInstanceSettingsState).subscribe((settings) => {
      this.maxImageSize = settings?.maxImageSize * 1048576; // Convert to bytes
    });
  }

  /**
   * Registers the onChange method for the ControlValueAccessor.
   *
   * @param fn Function to call on change.
   */
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  /**
   * Used by the formControl to write a value to the native formControl or any custom value.
   *
   * @param obj Value to write.
   */
  writeValue(obj: any): void {
    this.file = obj;
    this.syncFocusFromFile();
  }

  /**
   * Not implemented but needed for the interface.
   */
  registerOnTouched(_fn: any): void {}

  /**
   * Function is replaced in registerOnChange.
   */
  propagateChange = (_: any) => {};

  /**
   * Emits internal value when it changes.
   */
  onChange() {
    this.propagateChange(this.file);
  }

  /**
   * Validates whether there is an image uploaded.
   */
  validate() {
    return this.file !== null;
  }

  /**
   * Sets the disabled state of the component.
   *
   * @param isDisabled Disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  /**
   * Sets the given media as current value.
   *
   * @param event Event from PrimeNG containing the original upload response.
   */
  setMedia(event: any) {
    this.file = File.deserialize(event.originalEvent.body[0]);
    this.imageLoading = true;
    this.imageLoadingError = false;
    this.showProgressBar = false;
    this.syncFocusFromFile();
    this.onChange();
  }

  /**
   * Removes the current media.
   */
  removeMedia() {
    this.file = null;
    this.focusAdjustActive = false;
    this.onChange();
  }

  /**
   * Resets the component on destruction.
   */
  ngOnDestroy(): void {
    this.uploader?.clear();
  }

  /**
   * Starts the progress bar.
   */
  startProgress() {
    this.showProgressBar = true;
    this.progress = 0;
    this.progressMode = 'determinate';
  }

  /**
   * Sets a new progress value.
   * @param event Progress bar event.
   */
  setProgress(event: any) {
    this.progress = event.progress;
    if (this.progress === 100) {
      this.progressMode = 'indeterminate';
      this.progress = null;
    }
  }

  toggleFocusAdjust(): void {
    if (!this.file?.width || !this.file?.height) {
      return;
    }

    this.focusY = this.file.focusY ?? DEFAULT_IMAGE_FOCUS_Y;
    this.persistedFocusY = this.file.focusY;
    this.focusAdjustActive = true;
    this.updateFocusFrame();
  }

  confirmFocusAdjust(): void {
    const nextFocusY = normalizeImageFocusY(this.focusY);
    this.file.applyFocusY(nextFocusY);
    this.persistedFocusY = nextFocusY;
    this.onChange();
    this.focusAdjustActive = false;
    this.focusDragging = false;
  }

  cancelFocusAdjust(): void {
    this.focusY = this.persistedFocusY ?? DEFAULT_IMAGE_FOCUS_Y;
    this.file.applyFocusY(this.persistedFocusY);
    this.updateFocusFrame();
    this.focusAdjustActive = false;
    this.focusDragging = false;
  }

  resetFocusAdjust(): void {
    this.focusY = DEFAULT_IMAGE_FOCUS_Y;
    this.updateFocusFrame();
  }

  setFocusFromPointer(event: PointerEvent): void {
    if (!this.focusStage) {
      return;
    }
    const stageRect = this.focusStage.nativeElement.getBoundingClientRect();
    const nextFocusY = (event.clientY - stageRect.top) / stageRect.height;
    this.setFocusY(nextFocusY);
  }

  startFocusDrag(event: PointerEvent): void {
    if (!this.focusAdjustActive) {
      return;
    }

    event.preventDefault();
    this.focusDragging = true;
    this.setFocusFromPointer(event);

    const handleMove = (moveEvent: PointerEvent) => {
      if (!this.focusDragging) {
        return;
      }
      this.setFocusFromPointer(moveEvent);
    };

    const handleUp = () => {
      this.focusDragging = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  }

  private setFocusY(focusY: number): void {
    this.focusY = clampImageFocusY(focusY);
    this.updateFocusFrame();
  }

  private syncFocusFromFile(): void {
    if (!this.file) {
      return;
    }
    this.focusY = this.file.focusY ?? DEFAULT_IMAGE_FOCUS_Y;
    this.persistedFocusY = this.file.focusY;
    this.updateFocusFrame();
  }

  private updateFocusFrame(): void {
    if (!this.file?.width || !this.file?.height) {
      this.focusFrame = null;
      return;
    }
    this.focusFrame = computeFocusFrameRect(
      this.file.width,
      this.file.height,
      this.focusY,
    );
  }
}
