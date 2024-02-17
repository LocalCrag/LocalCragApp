import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../../cache/cache.service';
import {HttpClient} from '@angular/common/http';
import {File} from '../../models/file';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

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
  public createLine(file: any): Observable<File> {
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
            this.createLine(file).subscribe(uploadedFile => {
              resolve(uploadedFile.thumbnailXL)
            })
          });
        },
      },
    };
  }

}
