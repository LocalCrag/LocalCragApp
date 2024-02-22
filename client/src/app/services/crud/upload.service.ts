import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../../cache/cache.service';
import {HttpClient} from '@angular/common/http';
import {File} from '../../models/file';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {AlignAction, DeleteAction, ImageSpec, ResizeAction} from 'quill-blot-formatter';

/**
 * Adds event listeners for Blot Formatters ImageSpec to fix scrolling issues.
 * Taken from: https://github.com/Fandom-OSS/quill-blot-formatter/issues/7
 */
class CustomImageSpec extends ImageSpec {
  override getActions() {
    return [DeleteAction, ResizeAction, AlignAction];
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


/**
 * Service for uploading a file.
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private api: ApiService,
              private http: HttpClient) {
  }

  /**
   * Uploads a file.
   *
   * @return Observable of a File.
   */
  public uploadFile(file: any): Observable<File> {
    const formData = new FormData();
    formData.append("upload", file);
    return this.http.post(this.api.uploader.uploadFile(), formData).pipe(
      map(File.deserialize)
    );
  }

  /**
   * Returns a Quill module object containing the image uploader module.
   */
  public getQuillFileUploadModules() {
    return {
      imageUploader: {
        upload: (file: any) => {
          return new Promise((resolve, reject) => {
            this.uploadFile(file).subscribe(uploadedFile => {
              resolve(uploadedFile.thumbnailXL)
            })
          });
        },
      },
      blotFormatter: {
        specs: [CustomImageSpec]
      }
    };
  }

}
