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
          const objectType: ObjectType = data['objectType'];
          if (!objectType) {
            return EMPTY;
          }
          return this.route.parent.parent.paramMap.pipe(
            untilDestroyed(this),
            switchMap((params) => {
              let objectSlug: string;
              switch (objectType) {
                case ObjectType.Crag:
                  objectSlug = params.get('crag-slug');
                  break;
                case ObjectType.Sector:
                  objectSlug = params.get('sector-slug');
                  break;
                case ObjectType.Area:
                  objectSlug = params.get('area-slug');
                  break;
                case ObjectType.Line:
                  objectSlug = params.get('line-slug');
                  break;
                case ObjectType.User:
                  objectSlug = params.get('user-slug');
              }
              if (!objectSlug) {
                return EMPTY;
              }
              return this.galleryService.getGalleryImages(
                objectType,
                objectSlug,
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
      contentStyle: { overflow: 'visible' },
      data: {
        // todo add default tag depending on where it is opened
      },
    });
  }
}
