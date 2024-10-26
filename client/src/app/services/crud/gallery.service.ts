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

  public createGalleryImage(
    galleryImage: GalleryImage,
  ): Observable<GalleryImage> {
    return this.http
      .post(this.api.gallery.create(), GalleryImage.serialize(galleryImage))
      .pipe(map(GalleryImage.deserialize));
  }

  public getGalleryImages(
    objectType: ObjectType = null,
    objectSlug: string = null,
  ): Observable<GalleryImage[]> {
    let filterString = '';
    if (objectType && objectSlug) {
      const filters: string[] = [];
      filters.push(`tag-object-type=${objectType}`);
      filters.push(`tag-object-slug=${objectSlug}`);
      filterString = `?${filters.join('&')}`;
    }
    return this.http
      .get(this.api.gallery.getList(filterString))
      .pipe(
        map((galleryImageListJson: any) =>
          galleryImageListJson.map(GalleryImage.deserialize),
        ),
      );
  }
}
