import {
  Component,
  forwardRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
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
import { FileUpload } from 'primeng/fileupload';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../../../ngrx/selectors/instance-settings.selectors';
import { selectCurrentUser } from '../../../../../ngrx/selectors/auth.selectors';
import { TranslocoDirective } from '@jsverse/transloco';

import { ProgressBar } from 'primeng/progressbar';
import { Image } from 'primeng/image';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ImageEditDialogComponent } from '../image-edit-dialog/image-edit-dialog.component';

/**
 * A media upload component.
 */
@Component({
  selector: 'lc-multi-image-upload',
  templateUrl: './multi-image-upload.component.html',
  styleUrls: ['./multi-image-upload.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiImageUploadComponent),
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
    ImageEditDialogComponent,
  ],
})
export class MultiImageUploadComponent
  implements OnInit, ControlValueAccessor, OnDestroy
{
  @ViewChild(FileUpload) uploader: FileUpload;

  public uploadUrl: string;
  public isDisabled = false;
  public formControl: NgControl;
  public files: File[] = [];
  public imageLoading = true;
  public imageLoadingError = false;
  public progress: number = null;
  public progressMode: 'determinate' | 'indeterminate' = 'determinate';
  public showProgressBar = false;
  public maxImageSize: number;
  public editingFileId: string | null = null;
  public transforming = false;
  public currentUser: User | null = null;

  private api = inject(ApiService);
  private inj = inject(Injector);
  private store = inject(Store);
  private uploadService = inject(UploadService);

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
    this.files = Array.isArray(obj) ? obj : obj ? [obj] : [];
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
    this.propagateChange(this.files);
  }

  /**
   * Validates whether there is an image uploaded.
   */
  validate() {
    return this.files.length > 0;
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
    event.originalEvent.body.forEach((fileBody: any) => {
      this.files.push(File.deserialize(fileBody));
    });
    this.imageLoading = true;
    this.imageLoadingError = false;
    this.showProgressBar = false;
    this.onChange();
  }

  /**
   * Removes the current media.
   */
  removeMedia(index: number) {
    const [removed] = this.files.splice(index, 1);
    if (removed?.id === this.editingFileId) {
      this.editingFileId = null;
    }
    this.onChange();
  }

  openImageEdit(file: File): void {
    if (!file.width || !file.height || !this.canEdit(file)) {
      return;
    }
    this.editingFileId = file.id;
  }

  canEdit(file: File | null | undefined): boolean {
    return canEditUploadedImage(this.currentUser, file?.createdById);
  }

  onImageEditVisible(open: boolean): void {
    if (!open && this.transforming) {
      return;
    }
    if (!open) {
      this.editingFileId = null;
    }
  }

  get editingFile(): File | null {
    if (!this.editingFileId) {
      return null;
    }
    return this.files.find((file) => file.id === this.editingFileId) ?? null;
  }

  applyImageEdit(request: ImageEditRequest): void {
    const current = this.editingFile;
    if (!current || this.transforming) {
      return;
    }
    const previousId = current.id;
    this.transforming = true;
    this.uploadService
      .transformFile(current.id, request.rotation, request.crop)
      .subscribe({
        next: (file) => {
          this.files = this.files.map((existing) =>
            existing.id === previousId ? file : existing,
          );
          this.onChange();
          this.transforming = false;
          this.editingFileId = null;
        },
        error: () => {
          this.transforming = false;
        },
      });
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
}
