import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { GalleryImage } from '../../models/gallery-image';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../../models/paginated';

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getGalleryImage(galleryImageId: string): Observable<GalleryImage> {
    return this.http
      .get(this.api.gallery.getDetail(galleryImageId))
      .pipe(map(GalleryImage.deserialize));
  }

  public createGalleryImage(
    galleryImage: GalleryImage,
  ): Observable<GalleryImage> {
    return this.http
      .post(
        this.api.gallery.create(),
        GalleryImage.serializeForCreate(galleryImage),
      )
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
    filterString: string,
  ): Observable<Paginated<GalleryImage>> {
    return this.http
      .get(this.api.gallery.getList(filterString))
      .pipe(
        map((payload) =>
          Paginated.deserialize(payload, GalleryImage.deserialize),
        ),
      );
  }
}
