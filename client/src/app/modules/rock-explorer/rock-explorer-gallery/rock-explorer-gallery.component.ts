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
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { GalleriaModule } from 'primeng/galleria';
import { Menu } from 'primeng/menu';
import { Message } from 'primeng/message';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { forkJoin, of } from 'rxjs';
import { catchError, filter, take } from 'rxjs/operators';
import { Feature } from 'geojson';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { GalleryImage } from '../../../models/gallery-image';
import { File as LcFile } from '../../../models/file';
import { getObjectType, ObjectType } from '../../../models/object';
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
import { CoordinatesButtonComponent } from '../../shared/components/coordinates-button/coordinates-button.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { CoordinatesComponent } from '../../shared/forms/controls/coordinates/coordinates.component';
import { MultiImageUploadComponent } from '../../shared/forms/controls/multi-image-upload/multi-image-upload.component';

@Component({
  selector: 'lc-rock-explorer-gallery',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    GalleriaModule,
    MultiImageUploadComponent,
    GalleryImageSkeletonComponent,
    CoordinatesComponent,
    CoordinatesButtonComponent,
    Button,
    DialogModule,
    Menu,
    Message,
    Textarea,
    Toast,
    HasPermissionDirective,
    TranslocoDirective,
  ],
  providers: [MessageService],
  templateUrl: './rock-explorer-gallery.component.html',
  styleUrl: './rock-explorer-gallery.component.scss',
})
export class RockExplorerGalleryComponent
  implements OnInit, OnChanges, PaginatedListView
{
  @Input({ required: true }) object!: RockExplorerFeature;
  /** When false, omit the section heading (e.g. inside a tab). */
  @Input() showHeading = true;
  @Output() imagesChanged = new EventEmitter<void>();
  @Output() countChange = new EventEmitter<number>();
  @Output() editModeChange = new EventEmitter<boolean>();
  /** True while waiting for a map click to geotag an image. */
  @Output() mapPickChange = new EventEmitter<boolean>();
  /** Fired when local GPS values change (map pick or form) for live map dots. */
  @Output() coordinatesPreviewChange = new EventEmitter<void>();
  /** Fired after a gallery page load so the map can sync image GPS dots. */
  @Output() imagesLoaded = new EventEmitter<void>();
  /** Fly the map to an image's existing coordinates. */
  @Output() focusCoordinates = new EventEmitter<Coordinates>();

  public images: GalleryImage[] = [];
  public hasNextPage = true;
  public currentPage = 0;
  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.DEFAULT;
  public uploading = false;
  public editMode = false;
  /** Image currently waiting for a map click to set GPS. */
  public pickingImageId: string | null = null;
  public galleryVisible = false;
  public activeIndex = 0;
  public saving = false;
  public loggedInUser: User | null = null;
  public gpsMenuItems: MenuItem[] = [];
  public coordinatesDialogVisible = false;
  public coordinatesDialogValue: Coordinates | null = null;
  public uploadForm = inject(FormBuilder).group({
    images: [[] as LcFile[]],
  });

  private coordinatesDialogImage: GalleryImage | null = null;
  private descriptionSnapshot = new Map<string, string | null>();
  private coordinatesSnapshot = new Map<string, Coordinates | null>();
  /** Stable object refs for ngModel so change detection does not retrigger CVAs. */
  private coordinatesViewCache = new Map<string, Coordinates | null>();
  private destroyRef = inject(DestroyRef);
  private galleryService = inject(GalleryService);
  private store = inject(Store);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
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

    // Browse uploads raw files; attach each as a gallery image automatically.
    this.uploadForm
      .get('images')!
      .valueChanges.pipe(
        filter(
          (files): files is LcFile[] =>
            Array.isArray(files) && files.length > 0 && !this.uploading,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((files) => this.uploadImages(files));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['object'] || !this.object?.id) {
      return;
    }
    this.editMode = false;
    this.galleryVisible = false;
    this.saving = false;
    this.cancelMapPick();
    this.descriptionSnapshot.clear();
    this.coordinatesSnapshot.clear();
    this.coordinatesViewCache.clear();
    this.uploadForm.reset({ images: [] }, { emitEvent: false });
    this.countChange.emit(0);
    this.loadFirstPage();
  }

  setEditMode(enabled: boolean): void {
    this.editMode = enabled;
    if (enabled) {
      this.galleryVisible = false;
      this.snapshotEditState();
    } else {
      this.cancelMapPick();
      this.closeCoordinatesDialog();
      this.descriptionSnapshot.clear();
      this.coordinatesSnapshot.clear();
      this.coordinatesViewCache.clear();
    }
    this.editModeChange.emit(enabled);
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    for (const image of this.images) {
      if (this.descriptionSnapshot.has(image.id)) {
        image.description = this.descriptionSnapshot.get(image.id) ?? null;
      }
      if (this.coordinatesSnapshot.has(image.id) && image.image) {
        this.setImageCoordinates(
          image,
          this.coordinatesSnapshot.get(image.id) ?? null,
        );
      }
    }
    this.setEditMode(false);
  }

  saveAll(): void {
    if (this.saving) {
      return;
    }
    const dirty = this.images.filter((image) => this.isImageDirty(image));
    if (dirty.length === 0) {
      this.setEditMode(false);
      return;
    }
    this.saving = true;
    this.cdr.detectChanges();
    const gpsChanged = dirty.some((image) => this.isCoordinatesDirty(image));
    forkJoin(
      dirty.map((image) => {
        const payload = new GalleryImage();
        payload.id = image.id;
        payload.description = image.description ?? null;
        payload.image = image.image;
        payload.updateCoordinates = this.isCoordinatesDirty(image);
        return this.galleryService
          .updateGalleryImage(payload)
          .pipe(catchError(() => of(null)));
      }),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const failed = results.filter((r) => r == null).length;
          results.forEach((updated, index) => {
            if (updated) {
              dirty[index].description = updated.description;
              if (updated.image && dirty[index].image) {
                // Keep existing GPS if the response omits it (e.g. partial dump).
                if (updated.image.lat != null) {
                  dirty[index].image.lat = updated.image.lat;
                }
                if (updated.image.lng != null) {
                  dirty[index].image.lng = updated.image.lng;
                }
              }
            }
          });
          this.saving = false;
          if (failed > 0) {
            this.messageService.add({
              severity: 'error',
              summary: this.transloco.translate(
                marker('rockExplorer.imageSaveError'),
              ),
            });
            this.cdr.detectChanges();
            return;
          }
          this.store.dispatch(toastNotification('GALLERY_IMAGE_UPDATED'));
          this.setEditMode(false);
          // Sync map dots from local gallery state before any background refetch.
          this.coordinatesPreviewChange.emit();
          if (gpsChanged) {
            this.imagesChanged.emit();
          }
        },
        error: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.imageSaveError'),
            ),
          });
          this.cdr.detectChanges();
        },
      });
  }

  openGallery(index: number): void {
    if (this.editMode) {
      return;
    }
    this.activeIndex = index;
    this.galleryVisible = true;
  }

  getImageCoordinates(image: GalleryImage): Coordinates | null {
    const lat = image.image?.lat;
    const lng = image.image?.lng;
    if (lat == null || lng == null) {
      return null;
    }
    const cached = this.coordinatesViewCache.get(image.id);
    if (cached && cached.lat === lat && cached.lng === lng) {
      return cached;
    }
    const next = { lat, lng };
    this.coordinatesViewCache.set(image.id, next);
    return next;
  }

  setImageCoordinates(
    image: GalleryImage,
    coordinates: Coordinates | null,
  ): void {
    if (!image.image) {
      return;
    }
    const nextLat = coordinates?.lat ?? null;
    const nextLng = coordinates?.lng ?? null;
    if (image.image.lat === nextLat && image.image.lng === nextLng) {
      return;
    }
    image.image.lat = nextLat;
    image.image.lng = nextLng;
    if (nextLat == null || nextLng == null) {
      this.coordinatesViewCache.set(image.id, null);
    } else {
      this.coordinatesViewCache.set(image.id, { lat: nextLat, lng: nextLng });
    }
    this.coordinatesPreviewChange.emit();
  }

  toggleMapPick(image: GalleryImage): void {
    if (!image?.id || this.saving) {
      return;
    }
    if (this.pickingImageId === image.id) {
      this.cancelMapPick();
      return;
    }
    this.pickingImageId = image.id;
    this.mapPickChange.emit(true);
  }

  gpsButtonSeverity(image: GalleryImage): 'primary' | 'secondary' | 'danger' {
    if (this.pickingImageId === image.id) {
      return 'danger';
    }
    return this.getImageCoordinates(image) ? 'primary' : 'secondary';
  }

  openGpsMenu(event: Event, image: GalleryImage, menu: Menu): void {
    event.preventDefault();
    event.stopPropagation();
    this.gpsMenuItems = this.buildGpsMenuItems(image);
    menu.toggle(event);
  }

  openCoordinatesDialog(image: GalleryImage): void {
    this.coordinatesDialogImage = image;
    this.coordinatesDialogValue = this.cloneCoordinates(
      this.getImageCoordinates(image),
    );
    this.coordinatesDialogVisible = true;
    this.cdr.detectChanges();
  }

  closeCoordinatesDialog(): void {
    this.coordinatesDialogVisible = false;
    this.coordinatesDialogImage = null;
    this.coordinatesDialogValue = null;
  }

  applyCoordinatesDialog(): void {
    if (!this.coordinatesDialogImage) {
      this.closeCoordinatesDialog();
      return;
    }
    this.setImageCoordinates(
      this.coordinatesDialogImage,
      this.coordinatesDialogValue,
    );
    this.closeCoordinatesDialog();
  }

  private buildGpsMenuItems(image: GalleryImage): MenuItem[] {
    const coordinates = this.getImageCoordinates(image);
    const items: MenuItem[] = [];
    if (this.pickingImageId === image.id) {
      items.push({
        label: this.transloco.translate(
          marker('rockExplorer.cancelPickImageCoordinates'),
        ),
        icon: 'pi pi-times',
        command: () => this.cancelMapPick(),
      });
    } else {
      if (coordinates) {
        items.push({
          label: this.transloco.translate(
            marker('rockExplorer.imageGpsShowOnMap'),
          ),
          icon: 'pi pi-eye',
          command: () => this.focusCoordinates.emit(coordinates),
        });
      }
      items.push({
        label: this.transloco.translate(
          marker('rockExplorer.imageGpsPickOnMap'),
        ),
        icon: 'pi pi-map-marker',
        command: () => this.toggleMapPick(image),
      });
      items.push({
        label: this.transloco.translate(
          marker('rockExplorer.imageGpsEnterCoordinates'),
        ),
        icon: 'pi pi-pencil',
        command: () => this.openCoordinatesDialog(image),
      });
    }
    return items;
  }

  cancelMapPick(): void {
    if (!this.pickingImageId) {
      return;
    }
    this.pickingImageId = null;
    this.mapPickChange.emit(false);
  }

  /**
   * Applies a map click to the image currently in pick mode.
   * @returns true if the click was consumed.
   */
  applyMapPick(lat: number, lng: number): boolean {
    if (!this.pickingImageId) {
      return false;
    }
    const image = this.images.find((item) => item.id === this.pickingImageId);
    if (!image) {
      this.cancelMapPick();
      return false;
    }
    this.setImageCoordinates(image, { lat, lng });
    this.cancelMapPick();
    return true;
  }

  /** Current geotagged points from local edit state (for live map preview). */
  getGeotaggedMapFeatures(): Feature[] {
    return this.images
      .map((image) => this.toMapFeature(image))
      .filter((feature): feature is Feature => feature != null);
  }

  private toMapFeature(image: GalleryImage): Feature | null {
    const coordinates = this.getImageCoordinates(image);
    if (!coordinates || !image.image) {
      return null;
    }
    const thumbnailUrl =
      image.image.thumbnailM ||
      image.image.thumbnailS ||
      image.image.path ||
      '';
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat],
      },
      properties: {
        galleryImageId: image.id,
        thumbnailUrl,
        description: image.description ?? '',
      },
    };
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
      'tag-object-type': this.resolveObjectType(),
      'tag-object-id': this.object.id,
    };
    this.galleryService
      .getGalleryImages(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageResult) => {
          this.images.push(...pageResult.items);
          if (this.editMode) {
            this.snapshotEditState();
          }
          completePaginatedPageLoad(this, pageResult.hasNext);
          this.countChange.emit(this.images.length);
          this.imagesLoaded.emit();
          this.cdr.detectChanges();
        },
        error: () => {
          failPaginatedPageLoad(this);
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(marker('rockExplorer.loadError')),
          });
          this.cdr.detectChanges();
        },
      });
  }

  uploadImages(files: LcFile[]): void {
    if (!this.object?.id || this.uploading || files.length === 0) {
      return;
    }
    const objectType = this.resolveObjectType();
    this.uploading = true;
    this.uploadForm.disable({ emitEvent: false });

    forkJoin(
      files.map((file) => {
        const galleryImage = new GalleryImage();
        galleryImage.image = file;
        galleryImage.description = null;
        const tag = new Tag();
        tag.object = this.object;
        tag.objectType = objectType;
        galleryImage.tags = [tag];
        return this.galleryService
          .createGalleryImage(galleryImage)
          .pipe(catchError(() => of(null)));
      }),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const created = results.filter(
            (image): image is GalleryImage => image != null,
          );
          const failed = results.length - created.length;
          if (created.length > 0) {
            this.images = [...created, ...this.images];
            for (const image of created) {
              this.descriptionSnapshot.set(image.id, image.description ?? null);
              this.coordinatesSnapshot.set(
                image.id,
                this.cloneCoordinates(this.getImageCoordinates(image)),
              );
            }
            this.countChange.emit(this.images.length);
            this.imagesChanged.emit();
            this.imagesLoaded.emit();
            this.messageService.add({
              severity: 'success',
              summary: this.transloco.translate(
                created.length === 1
                  ? marker('rockExplorer.imageUploadSuccess')
                  : marker('rockExplorer.imageUploadSuccessPlural'),
              ),
            });
          }
          if (failed > 0) {
            this.messageService.add({
              severity: 'error',
              summary: this.transloco.translate(
                marker('rockExplorer.imageUploadError'),
              ),
            });
          }
          this.uploadForm.reset({ images: [] }, { emitEvent: false });
          this.uploadForm.enable({ emitEvent: false });
          this.uploading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.uploading = false;
          this.uploadForm.reset({ images: [] }, { emitEvent: false });
          this.uploadForm.enable({ emitEvent: false });
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.imageUploadError'),
            ),
          });
          this.cdr.detectChanges();
        },
      });
  }

  canDeleteImage(image: GalleryImage): boolean {
    return (
      image.createdBy?.id === this.loggedInUser?.id ||
      !!this.loggedInUser?.moderator
    );
  }

  confirmDeleteImage(event: Event, image: GalleryImage): void {
    this.confirmationService.confirm({
      target: event.currentTarget ?? event.target,
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
      accept: () => {
        this.deleteImage(image);
      },
    });
  }

  private snapshotEditState(): void {
    this.descriptionSnapshot.clear();
    this.coordinatesSnapshot.clear();
    for (const image of this.images) {
      this.descriptionSnapshot.set(image.id, image.description ?? null);
      this.coordinatesSnapshot.set(
        image.id,
        this.cloneCoordinates(this.getImageCoordinates(image)),
      );
    }
  }

  private isImageDirty(image: GalleryImage): boolean {
    if (!image?.id) {
      return false;
    }
    return this.isDescriptionDirty(image) || this.isCoordinatesDirty(image);
  }

  private isDescriptionDirty(image: GalleryImage): boolean {
    if (!this.descriptionSnapshot.has(image.id)) {
      return false;
    }
    const previous = this.descriptionSnapshot.get(image.id) ?? null;
    const next = image.description ?? null;
    return previous !== next;
  }

  private isCoordinatesDirty(image: GalleryImage): boolean {
    if (!this.coordinatesSnapshot.has(image.id)) {
      return false;
    }
    return !this.sameCoordinates(
      this.coordinatesSnapshot.get(image.id) ?? null,
      this.getImageCoordinates(image),
    );
  }

  private sameCoordinates(
    a: Coordinates | null,
    b: Coordinates | null,
  ): boolean {
    if (a == null && b == null) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return a.lat === b.lat && a.lng === b.lng;
  }

  private cloneCoordinates(
    coordinates: Coordinates | null,
  ): Coordinates | null {
    return coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null;
  }

  private resolveObjectType(): ObjectType {
    return getObjectType(this.object);
  }

  private deleteImage(image: GalleryImage): void {
    this.galleryService
      .deleteGalleryImage(image.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.images = this.images.filter((i) => i.id !== image.id);
          this.descriptionSnapshot.delete(image.id);
          this.coordinatesSnapshot.delete(image.id);
          this.coordinatesViewCache.delete(image.id);
          this.countChange.emit(this.images.length);
          this.imagesChanged.emit();
          this.store.dispatch(toastNotification('GALLERY_IMAGE_DELETED'));
          this.cdr.detectChanges();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.imageDeleteError'),
            ),
          });
          this.cdr.detectChanges();
        },
      });
  }
}
