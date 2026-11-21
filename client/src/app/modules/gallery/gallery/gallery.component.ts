import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
} from '@angular/core';
import { GalleryService } from '../../../services/crud/gallery.service';
import { GalleryImage } from '../../../models/gallery-image';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';

import { GalleryImageComponent } from '../gallery-image/gallery-image.component';
import { GalleryFormComponent } from '../gallery-form/gallery-form.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Store } from '@ngrx/store';
import { GalleryImageSkeletonComponent } from '../gallery-image-skeleton/gallery-image-skeleton.component';
import { ListSkeletonComponent } from '../../shared/components/list-skeleton/list-skeleton.component';
import { LoadingState } from '../../../enums/loading-state';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  failPaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ObjectType } from '../../../models/object';
import { ApiQueryParams } from '../../../utility/http/query-params';
import {
  galleryColumnCount,
  galleryImageWeight,
  GALLERY_SKELETON_LAYOUTS,
  MasonryEntry,
  packMasonryColumns,
} from '../../../utility/gallery-masonry';
import { galleryImageBelongsToObject } from '../../../utility/gallery-membership';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideImage,
  lucideInfo,
} from '@ng-icons/lucide';
import {
  galleryPreviewIndexAfterRemoval,
  GalleryPreviewDirection,
  galleryPreviewSwipeDirection,
  stepGalleryPreview,
} from '../../../utility/gallery-preview';

type GalleryMasonryCell =
  | { kind: 'image'; image: GalleryImage }
  | { kind: 'skeleton'; key: string; aspectRatio: string };

import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'lc-gallery',
  imports: [
    LoadingButtonComponent,
    ...HlmDialogImports,
    GalleryImageComponent,
    TranslocoDirective,
    HasPermissionDirective,
    GalleryImageSkeletonComponent,
    ListSkeletonComponent,
    InfiniteScrollDirective,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    NgIcon,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
      lucideImage,
      lucideInfo,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit, PaginatedListView {
  private confirmDialog = inject(ConfirmDialogService);
  public images: GalleryImage[] = [];
  public columns: GalleryMasonryCell[][] = [];
  public ref: BrnDialogRef<GalleryImage> | undefined;
  public hasNextPage = true;
  public currentPage = 0;
  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.INITIAL_LOADING;
  public previewVisible = false;
  public previewIndex = 0;

  /** Index of the first image from the page requested by the open preview. */
  private previewAdvanceTo: number | null = null;
  private previewTouch: { x: number; y: number } | null = null;
  private columnCount = galleryColumnCount(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );
  private objectSlug: string;
  private objectType: ObjectType;
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(HlmDialogService);
  private galleryService = inject(GalleryService);
  private store = inject(Store);
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

  @HostListener('window:resize')
  onWindowResize(): void {
    const next = galleryColumnCount(window.innerWidth);
    if (next === this.columnCount) {
      return;
    }
    this.columnCount = next;
    this.syncColumns();
    this.cdr.markForCheck();
  }

  loadFirstPage() {
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  loadNextPage() {
    const page = beginPaginatedPageLoad(this, () => {
      this.images = [];
      this.closePreview();
    });
    if (page === null) {
      return;
    }
    this.syncColumns();
    const params: ApiQueryParams = {
      page: this.currentPage,
    };
    if (this.objectType) {
      params['tag-object-type'] = this.objectType;
      params['tag-object-slug'] = this.objectSlug;
    }
    this.galleryService
      .getGalleryImages(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (images) => {
          this.images.push(...images.items);
          completePaginatedPageLoad(this, images.hasNext);
          this.finishPreviewAdvance();
          this.syncColumns();
          this.cdr.detectChanges();
        },
        error: () => {
          failPaginatedPageLoad(this);
          this.previewAdvanceTo = null;
          this.syncColumns();
          this.cdr.detectChanges();
        },
      });
  }

  addImage() {
    this.ref = this.dialogService.open<GalleryImage>(GalleryFormComponent, {
      title: this.translocoService.translate(marker('gallery.addImage')),
      contentClass: 'sm:max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto',
      context: {
        defaultSearchableSlug: this.objectSlug,
        defaultSearchableType: this.objectType,
      },
    });
    // Add gallery image after dialog is closed
    this.ref.closed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((galleryImage) => {
        if (galleryImage) {
          if (this.images.map((i) => i.id).indexOf(galleryImage.id) === -1) {
            this.images.unshift(galleryImage);
            if (this.previewVisible) {
              this.previewIndex += 1;
            }
            this.syncColumns();
            this.cdr.detectChanges();
          }
        }
      });
  }

  confirmDeleteImage(event: Event, image: GalleryImage) {
    this.confirmDialog.open({
      message: this.translocoService.translate(
        marker('gallery.askReallyWantToDeleteGalleryImage'),
      ),
      acceptLabel: this.translocoService.translate(marker('gallery.yesDelete')),
      rejectLabel: this.translocoService.translate(
        marker('gallery.noDontDelete'),
      ),
      destructive: true,
      accept: () => {
        this.deleteImage(image);
      },
    });
  }

  deleteImage(image: GalleryImage) {
    this.galleryService.deleteGalleryImage(image.id).subscribe(() => {
      this.dropLoadedImage(image.id);
      this.syncColumns();
      this.store.dispatch(toastNotification('GALLERY_IMAGE_DELETED'));
      this.cdr.detectChanges();
    });
  }

  editImage(image: GalleryImage) {
    this.ref = this.dialogService.open<GalleryImage>(GalleryFormComponent, {
      title: this.translocoService.translate(marker('gallery.editImage')),
      contentClass: 'sm:max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto',
      context: {
        galleryImage: image,
      },
    });
    this.ref.closed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((galleryImage) => {
        if (!galleryImage) {
          return;
        }
        if (
          galleryImageBelongsToObject(
            galleryImage,
            this.objectType,
            this.objectSlug,
          )
        ) {
          this.images = this.images.map((i) =>
            i.id === galleryImage.id ? galleryImage : i,
          );
          this.store.dispatch(toastNotification('GALLERY_IMAGE_UPDATED'));
        } else {
          const wasShown = this.images.some((i) => i.id === galleryImage.id);
          this.dropLoadedImage(galleryImage.id);
          if (wasShown) {
            this.store.dispatch(
              toastNotification('GALLERY_IMAGE_REMOVED_FROM_GALLERY'),
            );
          }
        }
        this.syncColumns();
        this.cdr.detectChanges();
      });
  }

  trackCell(cell: GalleryMasonryCell): string {
    return cell.kind === 'image' ? cell.image.id : cell.key;
  }

  openPreview(image: GalleryImage): void {
    const index = this.images.findIndex((item) => item.id === image.id);
    if (index < 0) {
      return;
    }
    this.previewIndex = index;
    this.previewVisible = true;
  }

  canStepPreview(direction: GalleryPreviewDirection): boolean {
    return (
      stepGalleryPreview({
        index: this.previewIndex,
        count: this.images.length,
        hasNextPage: this.hasNextPage,
        direction,
      }) !== null
    );
  }

  stepPreview(direction: GalleryPreviewDirection, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const step = stepGalleryPreview({
      index: this.previewIndex,
      count: this.images.length,
      hasNextPage: this.hasNextPage,
      direction,
    });
    if (!step) {
      return;
    }
    if (step.type === 'load-next') {
      this.queuePreviewAdvance(step.index);
      return;
    }
    this.previewIndex = step.index;
    this.cdr.markForCheck();
  }

  onPreviewTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1 || this.touchStartedOnButton(event)) {
      this.previewTouch = null;
      return;
    }
    const touch = event.touches[0];
    this.previewTouch = { x: touch.clientX, y: touch.clientY };
  }

  onPreviewTouchEnd(event: TouchEvent): void {
    const start = this.previewTouch;
    this.previewTouch = null;
    if (!start || event.changedTouches.length !== 1) {
      return;
    }
    const touch = event.changedTouches[0];
    const direction = galleryPreviewSwipeDirection(
      start.x,
      start.y,
      touch.clientX,
      touch.clientY,
    );
    if (!direction) {
      return;
    }
    this.stepPreview(direction, event);
  }

  onPreviewTouchCancel(): void {
    this.previewTouch = null;
  }

  @HostListener('document:keydown', ['$event'])
  onPreviewKeydown(event: KeyboardEvent): void {
    if (!this.previewVisible) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closePreview();
      this.cdr.markForCheck();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.stepPreview(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.stepPreview(-1);
    }
  }

  /**
   * Rebuilds columns from the current images and loading skeletons.
   * Appending a page only extends columns; a new column count repacks.
   */
  private syncColumns(): void {
    const entries: MasonryEntry<GalleryMasonryCell>[] = this.images.map(
      (image) => ({
        item: { kind: 'image', image },
        weight: galleryImageWeight(image.image?.width, image.image?.height),
      }),
    );
    const skeletonCount =
      this.loading === LoadingState.LOADING && this.currentPage > 1
        ? 3
        : this.loading === LoadingState.LOADING && this.currentPage === 1
          ? 6
          : 0;
    for (let index = 0; index < skeletonCount; index++) {
      const layout =
        GALLERY_SKELETON_LAYOUTS[index % GALLERY_SKELETON_LAYOUTS.length];
      entries.push({
        item: {
          kind: 'skeleton',
          key: `skeleton-${index}`,
          aspectRatio: layout.aspectRatio,
        },
        weight: layout.weight,
      });
    }
    this.columns = packMasonryColumns(entries, this.columnCount);
  }

  private dropLoadedImage(imageId: string): void {
    const removedIndex = this.images.findIndex((i) => i.id === imageId);
    this.images = this.images.filter((i) => i.id !== imageId);
    const nextIndex = galleryPreviewIndexAfterRemoval(
      this.previewIndex,
      removedIndex,
      this.images.length,
    );
    if (nextIndex === null) {
      this.closePreview();
    } else {
      this.previewIndex = nextIndex;
    }
  }

  private closePreview(): void {
    this.previewVisible = false;
    this.previewIndex = 0;
    this.previewAdvanceTo = null;
    this.previewTouch = null;
  }

  private touchStartedOnButton(event: TouchEvent): boolean {
    const target = event.target;
    return target instanceof Element && !!target.closest('button');
  }

  private queuePreviewAdvance(index: number): void {
    this.previewAdvanceTo = index;
    if (this.loading === LoadingState.LOADING) {
      return;
    }
    const pageBefore = this.currentPage;
    this.loadNextPage();
    if (this.currentPage === pageBefore) {
      this.previewAdvanceTo = null;
    }
  }

  private finishPreviewAdvance(): void {
    if (this.previewAdvanceTo === null) {
      return;
    }
    const target = this.previewAdvanceTo;
    this.previewAdvanceTo = null;
    if (this.previewVisible && target < this.images.length) {
      this.previewIndex = target;
    }
  }
}
