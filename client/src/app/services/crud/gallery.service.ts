import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { GalleryImage } from '../../models/gallery-image';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ObjectType } from '../../models/tag';

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getGalleryImage(galleryImageId: string): Observable<GalleryImage> {
    return this.http
      .get(this.api.gallery.getDetail(galleryImageId))
      .pipe(map(GalleryImage.deserialize));
  }

  public createGalleryImage(
    galleryImage: GalleryImage,
  ): Observable<GalleryImage> {
    return this.http
      .post(this.api.gallery.create(), GalleryImage.serializeForCreate(galleryImage))
      .pipe(map(GalleryImage.deserialize));
  }

  public updateGalleryImage(
    galleryImage: GalleryImage,
  ): Observable<GalleryImage> {
    return this.http
      .put(
        this.api.gallery.update(galleryImage.id),
        GalleryImage.serializeForUpdate(galleryImage),
      )
      .pipe(map(GalleryImage.deserialize));
  }

  public deleteGalleryImage(galleryImageId: string): Observable<null> {
    return this.http
      .delete(this.api.gallery.delete(galleryImageId))
      .pipe(map(() => null));
  }

  public getGalleryImages(
    objectType: ObjectType = null,
    objectSlug: string = null,
  ): Observable<GalleryImage[]> {
    const params = new URLSearchParams();
    if (objectType) {
      params.set('tag-object-type', objectType);
    }
    if (objectSlug) {
      params.set('tag-object-slug', objectSlug);
    }
    const filterString = params.toString() ? `?${params.toString()}` : '';
    return this.http
      .get(this.api.gallery.getList(filterString))
      .pipe(
        map((galleryImageListJson: any) =>
          galleryImageListJson.map(GalleryImage.deserialize),
        ),
      );
  }
}
