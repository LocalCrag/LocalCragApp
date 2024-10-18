import {
  Component,
  ElementRef,
  forwardRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
import {ImageModule} from 'primeng/image';
import {NgIf} from '@angular/common';
import {ProgressBarModule} from 'primeng/progressbar';
import {TranslocoDirective} from '@jsverse/transloco';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl,} from '@angular/forms';
import {File} from '../../../../../models/file';
import {ApiService} from '../../../../../services/core/api.service';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

@Component({
  selector: 'lc-avatar-upload',
  standalone: true,
  imports: [
    ButtonModule,
    FileUploadModule,
    ImageModule,
    NgIf,
    ProgressBarModule,
    TranslocoDirective,
    ProgressSpinnerModule,
  ],
  templateUrl: './avatar-upload.component.html',
  styleUrl: './avatar-upload.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AvatarUploadComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AvatarUploadComponent
  implements OnInit, ControlValueAccessor, OnDestroy
{
  @ViewChild(FileUpload) uploader: FileUpload;
  @ViewChild('uploader') uploaderElementRef: ElementRef<HTMLElement>;

  public uploadUrl: string;
  public isDisabled = false;
  public formControl: NgControl;
  public file: File;
  public imageLoading = true;
  public imageLoadingError = false;
  public progress: number = null;
  public progressMode = 'determinate';
  public showProgressBar = false;

  constructor(
    private api: ApiService,
    private inj: Injector,
  ) {}

  /**
   * Initializes the uploader component.
   */
  ngOnInit() {
    this.uploadUrl = this.api.uploader.uploadFile();
    this.formControl = this.inj.get(NgControl);
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
   * @param obj: Value to write.
   */
  writeValue(obj: any): void {
    this.file = obj;
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
   * @param event Event from PrimeNG containnig the original upload response.
   */
  setMedia(event: any) {
    this.file = File.deserialize(event.originalEvent.body);
    this.imageLoading = true;
    this.imageLoadingError = false;
    this.showProgressBar = false;
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

  getAvatarStyle() {
    let path = 'assets/user.png';
    if (this.file) {
      path = this.file.thumbnailM;
    }
    return `url(${path})`;
  }

  /**
   * Clicks the hidden prime nbg upload button component.
   */
  clickFileUpload() {
    this.uploaderElementRef['el'].nativeElement
      .querySelector('.p-fileupload-choose')
      .click();
  }
}
