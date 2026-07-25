import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ImageModule } from 'primeng/image';
import { Message } from 'primeng/message';
import { take } from 'rxjs/operators';
import { GalleryImage } from '../../../models/gallery-image';
import { File as LcFile } from '../../../models/file';
import { getObjectType } from '../../../models/object';
import { RockExplorerCluster } from '../../../models/rock-explorer-cluster';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { Tag } from '../../../models/tag';
import { User } from '../../../models/user';
import { LoadingState } from '../../../enums/loading-state';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { GalleryService } from '../../../services/crud/gallery.service';
import { ApiQueryParams } from '../../../utility/http/query-params';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  failPaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { GalleryImageSkeletonComponent } from '../../gallery/gallery-image-skeleton/gallery-image-skeleton.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';

@Component({
  selector: 'lc-rock-explorer-gallery',
  imports: [
    ReactiveFormsModule,
    ImageModule,
    SingleImageUploadComponent,
    GalleryImageSkeletonComponent,
    Button,
    ConfirmPopupModule,
    Message,
    HasPermissionDirective,
    TranslocoDirective,
  ],
  providers: [ConfirmationService],
  templateUrl: './rock-explorer-gallery.component.html',
  styleUrl: './rock-explorer-gallery.component.scss',
})
export class RockExplorerGalleryComponent
  implements OnInit, OnChanges, PaginatedListView
{
  @Input({ required: true }) object!: RockExplorerFeature | RockExplorerCluster;
  @Output() imagesChanged = new EventEmitter<void>();

  public images: GalleryImage[] = [];
  public hasNextPage = true;
  public currentPage = 0;
  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.DEFAULT;
  public uploading = false;
  public loggedInUser: User | null = null;
  public uploadForm = inject(FormBuilder).group({
    image: [null as LcFile | null],
  });

  private destroyRef = inject(DestroyRef);
  private galleryService = inject(GalleryService);
  private store = inject(Store);
  private confirmationService = inject(ConfirmationService);
  private transloco = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.store
      .select(selectCurrentUser)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.loggedInUser = user;
        this.cdr.detectChanges();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['object'] || !this.object?.id) {
      return;
    }
    this.uploadForm.reset({ image: null });
    this.loadFirstPage();
  }

  loadFirstPage(): void {
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  loadNextPage(): void {
    const page = beginPaginatedPageLoad(this, () => {
      this.images = [];
    });
    if (page === null) {
      return;
    }
    const params: ApiQueryParams = {
      page: this.currentPage,
      'tag-object-type': getObjectType(this.object),
      'tag-object-id': this.object.id,
    };
    this.galleryService
      .getGalleryImages(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageResult) => {
          this.images.push(...pageResult.items);
          completePaginatedPageLoad(this, pageResult.hasNext);
          this.cdr.detectChanges();
        },
        error: () => {
          failPaginatedPageLoad(this);
          this.cdr.detectChanges();
        },
      });
  }

  uploadImage(): void {
    const file = this.uploadForm.get('image')!.value;
    if (!file) {
      return;
    }
    const galleryImage = new GalleryImage();
    galleryImage.image = file;
    const tag = new Tag();
    tag.object = this.object;
    galleryImage.tags = [tag];
    this.uploading = true;
    this.galleryService
      .createGalleryImage(galleryImage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          this.images.unshift(created);
          this.uploadForm.reset({ image: null });
          this.uploading = false;
          this.imagesChanged.emit();
          this.store.dispatch(toastNotification('GALLERY_IMAGE_CREATED'));
          this.cdr.detectChanges();
        },
        error: () => {
          this.uploading = false;
          this.cdr.detectChanges();
        },
      });
  }

  confirmDeleteImage(event: Event, image: GalleryImage): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.transloco.translate(
        marker('rockExplorer.imageDeleteConfirm'),
      ),
      acceptLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteYes'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteNo'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteImage(image),
    });
  }

  private deleteImage(image: GalleryImage): void {
    this.galleryService
      .deleteGalleryImage(image.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.images = this.images.filter((i) => i.id !== image.id);
          this.imagesChanged.emit();
          this.store.dispatch(toastNotification('GALLERY_IMAGE_DELETED'));
          this.cdr.detectChanges();
        },
        error: () => {
          this.cdr.detectChanges();
        },
      });
  }
}
