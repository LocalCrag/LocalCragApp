import {
  Component,
  forwardRef,
  Injector,
  OnInit,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil } from '@ng-icons/lucide';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
} from '@angular/forms';
import { File } from '../../../../../models/file';
import { ApiService } from '../../../../../services/core/api.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { splitFilesByMaxSize, uploadFormFiles } from '../upload-form-files';
import { toastNotification } from '../../../../../ngrx/actions/notifications.actions';
import { selectInstanceSettingsState } from '../../../../../ngrx/selectors/instance-settings.selectors';
import { Store } from '@ngrx/store';

@Component({
  selector: 'lc-avatar-upload',
  imports: [NgIcon, HlmButton, HlmSpinner],
  templateUrl: './avatar-upload.component.html',
  styleUrl: './avatar-upload.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AvatarUploadComponent),
      multi: true,
    },
    provideIcons({ lucidePencil }),
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class AvatarUploadComponent implements OnInit, ControlValueAccessor {
  public uploadUrl: string;
  public isDisabled = false;
  public formControl: NgControl;
  public file: File;
  public imageLoading = true;
  public imageLoadingError = false;
  public progress: number = null;
  public progressMode = 'determinate';
  public showProgressBar = false;
  public maxImageSize: number;

  private api = inject(ApiService);
  private http = inject(HttpClient);
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
   * @param event Event from PrimeNG containing the original upload response.
   */
  setMedia(event: any) {
    this.file = File.deserialize(event.originalEvent.body[0]);
    this.imageLoading = true;
    this.imageLoadingError = false;
    this.showProgressBar = false;
    this.onChange();
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

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) {
      return;
    }
    const { accepted, oversized } = splitFilesByMaxSize(
      files,
      this.maxImageSize,
    );
    if (oversized) {
      this.store.dispatch(
        toastNotification(
          'IMAGE_TOO_LARGE',
          {},
          {
            max: Math.round(this.maxImageSize / 1048576),
          },
        ),
      );
    }
    if (!accepted.length) {
      return;
    }
    this.startProgress();
    uploadFormFiles(this.http, this.uploadUrl, accepted, {
      onProgress: (progress) => this.setProgress({ progress }),
      onBody: (body) => this.setMedia({ originalEvent: { body } }),
      onError: () => {
        this.showProgressBar = false;
      },
    });
  }
}
