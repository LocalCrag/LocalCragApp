import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { File } from '../../models/file';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DeleteAction, ImageSpec, ResizeAction } from 'quill-blot-formatter';
import {
  ImageEditRequest,
  ImageRotation,
  PixelCrop,
} from '../../utility/image-edit';
import { ImageFocusY, normalizeImageFocusY } from '../../utility/image-focus';

/**
 * Adds event listeners for Blot Formatters ImageSpec to fix scrolling issues.
 * Taken from: https://github.com/Fandom-OSS/quill-blot-formatter/issues/7
 */
class CustomImageSpec extends ImageSpec {
  override getActions() {
    return [DeleteAction, ResizeAction];
  }

  override init() {
    this.formatter.quill.root.addEventListener('click', this.onClick);

    // handling scroll event
    this.formatter.quill.root.addEventListener('scroll', () => {
      this.formatter.repositionOverlay();
    });

    // handling align
    this.formatter.quill.on('editor-change', (eventName, ...args) => {
      if (eventName === 'selection-change' && args[2] === 'api') {
        setTimeout(() => {
          this.formatter.repositionOverlay();
        }, 10);
      }
    });
  }
}

export interface FileUploadProgress {
  loaded: number;
  total: number | null;
  file?: File;
}

/**
 * Service for uploading a file.
 */
@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  /**
   * Uploads a file.
   *
   * @return Observable of a File.
   */
  public uploadFile(file: any): Observable<File> {
    const formData = new FormData();
    formData.append('upload', file);
    return this.http
      .post<File[]>(this.api.uploader.uploadFile(), formData)
      .pipe(map((response: File[]) => File.deserialize(response[0])));
  }

  /**
   * Uploads a file and reports how much of it has been sent.
   * `file` is set on the final event, once the server has stored it.
   */
  public uploadFileWithProgress(file: Blob): Observable<FileUploadProgress> {
    const formData = new FormData();
    formData.append('upload', file);
    return this.http
      .post<File[]>(this.api.uploader.uploadFile(), formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        filter(
          (event) =>
            event.type === HttpEventType.UploadProgress ||
            event.type === HttpEventType.Response,
        ),
        map((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            return {
              loaded: event.loaded,
              total: event.total ?? null,
            };
          }
          const response = event as HttpResponse<File[]>;
          return {
            loaded: 0,
            total: null,
            file: File.deserialize(response.body[0]),
          };
        }),
      );
  }

  /**
   * Updates horizontal focus metadata for an uploaded file.
   */
  /**
   * Stores a rotated and cropped copy of an uploaded image.
   */
  public transformFile(
    fileId: string,
    rotation: ImageRotation,
    crop: PixelCrop | null,
  ): Observable<File> {
    const body: ImageEditRequest = { rotation, crop };
    return this.http
      .post<any>(this.api.files.transform(fileId), body)
      .pipe(map((response) => File.deserialize(response)));
  }

  public updateFileFocus(
    fileId: string,
    focusY: ImageFocusY | null,
  ): Observable<File> {
    return this.http
      .patch<any>(this.api.files.update(fileId), { focusY })
      .pipe(map((response) => File.deserialize(response)));
  }

  /**
   * Persists focus metadata when it changed since the form was loaded.
   */
  public saveFileFocusIfChanged(
    file: File | null | undefined,
  ): Observable<File | null> {
    if (!file?.id) {
      return of(null);
    }

    const nextFocusY = normalizeImageFocusY(file.focusY);
    const originalFocusY = normalizeImageFocusY(file.focusYAtLoad);
    if (nextFocusY === originalFocusY) {
      return of(null);
    }

    return this.updateFileFocus(file.id, nextFocusY);
  }

  /**
   * Returns a Quill module object containing the image uploader module.
   */
  public getQuillFileUploadModules() {
    return {
      imageUploader: {
        upload: (file: any) => {
          return new Promise((resolve) => {
            this.uploadFile(file).subscribe((uploadedFile) => {
              resolve(uploadedFile.thumbnailXL);
            });
          });
        },
      },
      blotFormatter: {
        specs: [CustomImageSpec],
      },
    };
  }
}
