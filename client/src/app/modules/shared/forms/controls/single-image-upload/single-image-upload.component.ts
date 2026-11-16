import {
  Component,
  ElementRef,
  forwardRef,
  Injector,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { ApiService } from '../../../../../services/core/api.service';
import { UploadService } from '../../../../../services/crud/upload.service';
import {
  canEditUploadedImage,
  ImageEditRequest,
} from '../../../../../utility/image-edit';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
} from '@angular/forms';
import { File } from '../../../../../models/file';
import { User } from '../../../../../models/user';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../../../ngrx/selectors/instance-settings.selectors';
import { selectCurrentUser } from '../../../../../ngrx/selectors/auth.selectors';
import { TranslocoDirective } from '@jsverse/transloco';

import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { ImageEditDialogComponent } from '../image-edit-dialog/image-edit-dialog.component';
import { uploadFormFiles } from '../upload-form-files';
import { sharedLucideIcons } from '../../../utils/prime-icon';
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
    provideIcons(sharedLucideIcons),
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    TranslocoDirective,
    NgIcon,
    HlmButton,
    HlmTooltip,
    ...HlmProgressImports,
    ...HlmDialogImports,
    ImageEditDialogComponent,
  ],
})
export class SingleImageUploadComponent
  implements OnInit, ControlValueAccessor
{
  @ViewChild('focusStage') focusStage?: ElementRef<HTMLElement>;

  @Input() focusAdjustable = false;
  @Input() fullWidth = false;

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
  public imageEditOpen = false;
  public transforming = false;
  public previewUrl: string | null = null;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public currentUser: User | null = null;

  private api = inject(ApiService);
  private inj = inject(Injector);
  private store = inject(Store);
  private uploadService = inject(UploadService);
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
    this.store.select(selectCurrentUser).subscribe((user) => {
      this.currentUser = user;
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
    this.file = obj ?? null;
    if (this.file && this.file.focusYAtLoad === undefined) {
      this.file.snapshotFocusYAtLoad();
    }
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
    this.imageEditOpen = false;
    this.onChange();
  }

  openImageEdit(): void {
    if (
      !this.file?.width ||
      !this.file?.height ||
      this.focusAdjustActive ||
      !this.canEdit(this.file)
    ) {
      return;
    }
    this.imageEditOpen = true;
  }

  canEdit(file: File | null | undefined): boolean {
    return canEditUploadedImage(this.currentUser, file?.createdById);
  }

  onImageEditVisible(open: boolean): void {
    if (!open && this.transforming) {
      return;
    }
    this.imageEditOpen = open;
  }

  applyImageEdit(request: ImageEditRequest): void {
    if (!this.file || this.transforming) {
      return;
    }
    this.transforming = true;
    this.uploadService
      .transformFile(this.file.id, request.rotation, request.crop)
      .subscribe({
        next: (file) => {
          this.file = file;
          this.imageLoading = true;
          this.imageLoadingError = false;
          this.syncFocusFromFile();
          this.onChange();
          this.transforming = false;
          this.imageEditOpen = false;
        },
        error: () => {
          this.transforming = false;
        },
      });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) {
      return;
    }
    if (
      this.maxImageSize &&
      files.some((file) => file.size > this.maxImageSize)
    ) {
      this.showProgressBar = false;
      return;
    }
    this.startProgress();
    uploadFormFiles(this.http, this.uploadUrl, files, {
      onProgress: (progress) => this.setProgress({ progress }),
      onBody: (body) => this.setMedia({ originalEvent: { body } }),
      onError: () => {
        this.showProgressBar = false;
      },
    });
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
      // The preview sits under an OnPush parent, which a window listener
      // does not mark, so the frame would stay put until release.
      this.cdr.detectChanges();
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
