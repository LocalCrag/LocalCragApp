import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { GalleryService } from '../../../services/crud/gallery.service';
import { GalleryImage } from '../../../models/gallery-image';
import { ObjectType } from '../../../models/tag';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ImageModule } from 'primeng/image';
import { NgForOf, NgIf } from '@angular/common';
import { GalleryImageComponent } from '../gallery-image/gallery-image.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GalleryFormComponent } from '../gallery-form/gallery-form.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { environment } from '../../../../environments/environment';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { GalleryImageSkeletonComponent } from '../gallery-image-skeleton/gallery-image-skeleton.component';
import { LoadingState } from '../../../enums/loading-state';
import { Message } from 'primeng/message';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

@Component({
  selector: 'lc-gallery',
  imports: [
    ImageModule,
    NgForOf,
    GalleryImageComponent,
    ButtonModule,
    TranslocoDirective,
    HasPermissionDirective,
    ConfirmPopupModule,
    GalleryImageSkeletonComponent,
    NgIf,
    Message,
    InfiniteScrollDirective,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  providers: [DialogService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@UntilDestroy()
export class GalleryComponent implements OnInit {
  public images: GalleryImage[] = [];
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;
  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;

  private objectSlug: string;
  private objectType: ObjectType;

  constructor(
    private dialogService: DialogService,
    private galleryService: GalleryService,
    private store: Store,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private translocoService: TranslocoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.data
      .pipe(
        untilDestroyed(this),
        switchMap((data) => {
          this.objectType = data['objectType'];
          return this.route.parent.parent.paramMap.pipe(
            untilDestroyed(this),
            map((params) => {
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
            }),
          );
        }),
      )
      .subscribe(() => {
        this.loadFirstPage();
      });
  }

  loadFirstPage() {
    this.currentPage = 0;
    this.hasNextPage = true;
    this.loadNextPage();
  }

  loadNextPage() {
    if (
      this.loadingFirstPage !== LoadingState.LOADING &&
      this.loadingAdditionalPage !== LoadingState.LOADING &&
      this.hasNextPage
    ) {
      this.currentPage += 1;
      if (this.currentPage === 1) {
        this.loadingFirstPage = LoadingState.LOADING;
        this.images = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      const filters = new URLSearchParams({
        page: this.currentPage.toString(),
      });
      if (this.objectType) {
        filters.set('tag-object-type', this.objectType);
        filters.set('tag-object-slug', this.objectSlug);
      }
      const filterString = `?${filters.toString()}`;
      this.galleryService
        .getGalleryImages(filterString)
        .pipe(
          map((images) => {
            this.images.push(...images.items);
            this.hasNextPage = images.hasNext;
            this.loadingFirstPage = LoadingState.DEFAULT;
            this.loadingAdditionalPage = LoadingState.DEFAULT;
            this.cdr.detectChanges();
          }),
        )
        .subscribe();
    }
  }

  addImage() {
    this.ref = this.dialogService.open(GalleryFormComponent, {
      modal: true,
      header: this.translocoService.translate(marker('gallery.addImage')),
      focusOnShow: false,
      data: {
        defaultSearchableSlug: this.objectSlug,
        defaultSearchableType: this.objectType,
      },
      closable: true,
      closeOnEscape: true,
    });
    // Add gallery image after dialog is closed
    this.ref.onClose
      .pipe(untilDestroyed(this))
      .subscribe((galleryImage: GalleryImage) => {
        if (galleryImage) {
          if (this.images.map((i) => i.id).indexOf(galleryImage.id) === -1) {
            this.images.unshift(galleryImage);
            this.cdr.detectChanges();
          }
        }
      });
  }

  confirmDeleteImage(event: Event, image: GalleryImage) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(
          marker('gallery.askReallyWantToDeleteGalleryImage'),
        ),
        acceptLabel: this.translocoService.translate(
          marker('gallery.yesDelete'),
        ),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('gallery.noDontDelete'),
        ),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteImage(image);
        },
      });
    });
  }

  deleteImage(image: GalleryImage) {
    this.galleryService.deleteGalleryImage(image.id).subscribe(() => {
      this.images = this.images.filter((i) => i.id !== image.id);
      this.store.dispatch(toastNotification('GALLERY_IMAGE_DELETED'));
      this.cdr.detectChanges();
    });
  }

  editImage(image: GalleryImage) {
    this.ref = this.dialogService.open(GalleryFormComponent, {
      modal: true,
      header: this.translocoService.translate(marker('gallery.editImage')),
      focusOnShow: false,
      data: {
        galleryImage: image,
      },
      closable: true,
      closeOnEscape: true,
    });
    this.ref.onClose
      .pipe(untilDestroyed(this))
      .subscribe((galleryImage: GalleryImage) => {
        if (galleryImage) {
          this.images = this.images.map((i) =>
            i.id === galleryImage.id ? galleryImage : i,
          );
          this.cdr.detectChanges();
        }
      });
  }
}
