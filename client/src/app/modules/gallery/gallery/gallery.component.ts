import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { GalleryService } from '../../../services/crud/gallery.service';
import { GalleryImage } from '../../../models/gallery-image';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';

import { ImageModule } from 'primeng/image';

import { GalleryImageComponent } from '../gallery-image/gallery-image.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GalleryFormComponent } from '../gallery-form/gallery-form.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { GalleryImageSkeletonComponent } from '../gallery-image-skeleton/gallery-image-skeleton.component';
import { LoadingState } from '../../../enums/loading-state';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { Message } from 'primeng/message';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ObjectType } from '../../../models/object';
import { ApiQueryParams } from '../../../utility/http/query-params';

@Component({
  selector: 'lc-gallery',
  imports: [
    ImageModule,
    GalleryImageComponent,
    ButtonModule,
    TranslocoDirective,
    HasPermissionDirective,
    ConfirmPopupModule,
    GalleryImageSkeletonComponent,
    Message,
    InfiniteScrollDirective,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  providers: [DialogService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit, PaginatedListView {
  public images: GalleryImage[] = [];
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;
  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.DEFAULT;

  private objectSlug: string;
  private objectType: ObjectType;
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);
  private galleryService = inject(GalleryService);
  private store = inject(Store);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private translocoService = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((data) => {
          this.objectType = data['objectType'];
          return this.route.parent.parent.paramMap.pipe(
            takeUntilDestroyed(this.destroyRef),
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
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  loadNextPage() {
    const page = beginPaginatedPageLoad(this, () => {
      this.images = [];
    });
    if (page === null) {
      return;
    }
    const params: ApiQueryParams = {
      page: this.currentPage,
    };
    if (this.objectType) {
      params['tag-object-type'] = this.objectType;
      params['tag-object-slug'] = this.objectSlug;
    }
    this.galleryService
      .getGalleryImages(params)
      .pipe(
        map((images) => {
          this.images.push(...images.items);
          completePaginatedPageLoad(this, images.hasNext);
          this.cdr.detectChanges();
        }),
      )
      .subscribe();
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('gallery.askReallyWantToDeleteGalleryImage'),
      ),
      acceptLabel: this.translocoService.translate(marker('gallery.yesDelete')),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('gallery.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteImage(image);
      },
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
