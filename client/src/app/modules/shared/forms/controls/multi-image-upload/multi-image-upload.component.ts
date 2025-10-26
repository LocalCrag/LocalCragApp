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
  imports: [TranslocoDirective, FileUpload, ProgressBar, Image, Button],
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
  public progressMode = 'determinate';
  public showProgressBar = false;
  public maxImageSize: number;

  private api = inject(ApiService);
  private inj = inject(Injector);
  private store = inject(Store);

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
    this.files.splice(index, 1);
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
}
