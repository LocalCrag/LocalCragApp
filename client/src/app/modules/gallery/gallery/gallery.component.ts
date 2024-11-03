import { Component, OnInit } from '@angular/core';
import { GalleryService } from '../../../services/crud/gallery.service';
import { GalleryImage } from '../../../models/gallery-image';
import { ObjectType } from '../../../models/tag';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY } from 'rxjs';
import { ImageModule } from 'primeng/image';
import { NgForOf, NgStyle } from '@angular/common';
import { GalleryImageComponent } from '../gallery-image/gallery-image.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GalleryFormComponent } from '../gallery-form/gallery-form.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'lc-gallery',
  standalone: true,
  imports: [
    ImageModule,
    NgForOf,
    NgStyle,
    GalleryImageComponent,
    ButtonModule,
    TranslocoDirective,
    HasPermissionDirective,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  providers: [DialogService, ConfirmationService],
})
@UntilDestroy()
export class GalleryComponent implements OnInit {
  public isLoading = false;
  public images: GalleryImage[] = [];
  public ref: DynamicDialogRef | undefined;

  private objectSlug: string;
  private objectType: ObjectType;

  constructor(
    private dialogService: DialogService,
    private galleryService: GalleryService,
    private route: ActivatedRoute,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.route.data
      .pipe(
        untilDestroyed(this),
        switchMap((data) => {
          this.objectType = data['objectType'];
          if (!this.objectType) {
            return EMPTY;
          }
          return this.route.parent.parent.paramMap.pipe(
            untilDestroyed(this),
            switchMap((params) => {
              switch (this.objectType) {
                case ObjectType.Crag:
                  this.objectSlug = params.get('crag-slug');
                  break;
                case ObjectType.Sector:
                  this.objectSlug = params.get('sector-slug');
                  break;
                case ObjectType.Area:
                  this.objectSlug = params.get('area-slug');
                  break;
                case ObjectType.Line:
                  this.objectSlug = params.get('line-slug');
                  break;
                case ObjectType.User:
                  this.objectSlug = params.get('user-slug');
              }
              if (!this.objectSlug) {
                return EMPTY;
              }
              return this.galleryService.getGalleryImages(
                this.objectType,
                this.objectSlug,
              );
            }),
          );
        }),
      )
      .subscribe((images: GalleryImage[]) => {
        this.images = images;
        this.isLoading = false;
      });
  }

  addImage() {
    this.ref = this.dialogService.open(GalleryFormComponent, {
      header: this.translocoService.translate(marker('gallery.addImage')),
      focusOnShow: false,
      data: {
        defaultSearchableSlug: this.objectSlug,
        defaultSearchableType: this.objectType,
      },
    });
    // Add or update gallery image after dialog is closed
    this.ref.onClose
      .pipe(untilDestroyed(this))
      .subscribe((galleryImage: GalleryImage) => {
        if (galleryImage) {
          console.log(galleryImage);
          if (this.images.map((i) => i.id).indexOf(galleryImage.id) === -1) {
            this.images.unshift(galleryImage);
          } else {
            this.images = this.images.map((i) =>
              i.id === galleryImage.id ? galleryImage : i,
            );
          }
        }
      });
  }
}
