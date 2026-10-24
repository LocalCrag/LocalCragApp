import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import {
  ConfirmationService,
  MenuItem,
  PrimeIcons,
  SelectItem,
} from 'primeng/api';
import { forkJoin, mergeMap, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { ActivatedRoute, Router, RouterLink, Scroll } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoDirective,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { TopoImage } from '../../../models/topo-image';
import { TopoImagesService } from '../../../services/crud/topo-images.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { LinePath } from '../../../models/line-path';
import { LinePathsService } from '../../../services/crud/line-paths.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';

import { NgClass, NgTemplateOutlet, ViewportScroller } from '@angular/common';
import { filter, take } from 'rxjs/operators';
import { Line } from '../../../models/line';
import {
  selectCanContributeTopo,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { TicksService } from '../../../services/crud/ticks.service';
import { AreasService } from '../../../services/crud/areas.service';
import { Actions, ofType } from '@ngrx/effects';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { highlightColor, textColor } from '../../../utility/misc/color';
import { ScalesService } from '../../../services/crud/scales.service';
import { DataView } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { GymModeDirective } from '../../shared/directives/gym-mode.directive';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Message } from 'primeng/message';
import { TopoImageListSkeletonComponent } from '../topo-image-list-skeleton/topo-image-list-skeleton.component';
import { TopoImageDetailsComponent } from '../topo-image-details/topo-image-details.component';
import { ApiQueryParams } from '../../../utility/http/query-params';
import { ArchiveService } from '../../../services/crud/archive.service';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { Rating } from 'primeng/rating';
import { TickButtonComponent } from '../../ascent/tick-button/tick-button.component';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { LineBoolPropListComponent } from '../../line/line-bool-prop-list/line-bool-prop-list.component';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { TopoImageViewerComponent } from '../../shared/components/topo-image/topo-image-viewer.component';
import { LineNumberBadgeComponent } from '../../shared/components/line-number-badge/line-number-badge.component';
import { DraftTagComponent } from '../../shared/components/draft-tag/draft-tag.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  primaryTopoLinePaths,
  topoImageCanHideVariants,
  topoLinePathDisplayNumbers,
  variantTopoLinePaths,
} from '../../../utility/topo/line-path-variants';

/**
 * Component that lists all topo images in an area.
 */
@Component({
  selector: 'lc-topo-image-list',
  templateUrl: './topo-image-list.component.html',
  styleUrls: ['./topo-image-list.component.scss'],
  providers: [
    ConfirmationService,
    DialogService,
    { provide: TRANSLOCO_SCOPE, useValue: 'topoImage' },
  ],
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    DataView,
    Select,
    FormsModule,
    GymModeDirective,
    Button,
    Menu,
    HasPermissionDirective,
    RouterLink,
    Message,
    TopoImageListSkeletonComponent,
    NgClass,
    NgTemplateOutlet,
    TopoImageDetailsComponent,
    ClosedSpotTagComponent,
    Rating,
    TickButtonComponent,
    ConfirmPopup,
    LineBoolPropListComponent,
    LineGradePipe,
    TopoImageViewerComponent,
    LineNumberBadgeComponent,
    DraftTagComponent,
  ],
})
export class TopoImageListComponent implements OnInit {
  @ViewChild('topoImageMenu') topoImageMenu: Menu;

  public topoImages: TopoImage[];
  public topoImageActionItems: MenuItem[] = [];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public sectorSlug: string;
  public areaSlug: string;
  public ref: DynamicDialogRef | undefined;
  public ticks: Set<string>;
  public showArchive = false;
  public displayUserRating = false;
  public currentUserId: string | null = null;
  public viewerIsModerator = false;
  public canContributeTopo = false;
  public gymMode = false;
  /** Topo image ids whose variant lines are expanded in the list and drawing. */
  private expandedVariantImageIds = new Set<string>();
  /** Stays on screen after the menu closes, so confirm popups can anchor to it. */
  private actionAnchor: EventTarget | null = null;

  private scrollTarget: Scroll;
  private stopAnchorScroll: (() => void) | null = null;

  private destroyRef = inject(DestroyRef);
  private topoImagesService = inject(TopoImagesService);
  private store = inject(Store);
  private confirmationService = inject(ConfirmationService);
  private ticksService = inject(TicksService);
  private areasService = inject(AreasService);
  private actions$ = inject(Actions);
  private dialogService = inject(DialogService);
  private linePathsService = inject(LinePathsService);
  private archiveService = inject(ArchiveService);
  private route = inject(ActivatedRoute);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private viewportScroller = inject(ViewportScroller);

  protected scalesService = inject(ScalesService);

  constructor() {
    this.destroyRef.onDestroy(() => this.stopAnchorScroll?.());
    this.router.events
      .pipe(filter((event): event is Scroll => event instanceof Scroll))
      .subscribe((e) => {
        if (e.position) {
          this.scrollTarget = e;
          this.restoreScrollPosition();
        } else {
          this.scrollTarget = null;
        }
      });
  }

  /**
   * Loads the lines on initialization.
   */
  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cragSlug =
          this.route.parent.parent.snapshot.paramMap.get('crag-slug');
        this.sectorSlug =
          this.route.parent.parent.snapshot.paramMap.get('sector-slug');
        this.areaSlug =
          this.route.parent.parent.snapshot.paramMap.get('area-slug');
        this.refreshData();
      });
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.actions$
      .pipe(ofType(reloadAfterAscent), takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        this.ticks.add(action.ascendedLineId);
      });
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.displayUserRating = instanceSettings.displayUserRatings;
        this.gymMode = instanceSettings.gymMode;
      });
    this.store
      .select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUserId = user?.id ?? null;
        this.viewerIsModerator = !!user?.moderator;
      });
    this.store
      .select(selectCanContributeTopo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((canContribute) => {
        this.canContributeTopo = canContribute;
      });
  }

  /**
   * The overflow menu is shown when this viewer can do something with the image.
   */
  showTopoImageActions(topoImage: TopoImage): boolean {
    return (
      this.canDrawLines(topoImage) ||
      this.canReorderLines(topoImage) ||
      this.canAcceptDraft(topoImage) ||
      this.canManage(topoImage) ||
      this.canDelete(topoImage) ||
      this.canArchive(topoImage)
    );
  }

  /**
   * Owners edit their drafts. Moderators edit published images, and review someone else's draft instead of editing it.
   */
  canManage(topoImage: TopoImage): boolean {
    if (topoImage.publicationStatus === 'draft') {
      return topoImage.createdById === this.currentUserId;
    }
    return this.viewerIsModerator;
  }

  /** Create and draw stay with the draft owner. Moderators and suggesters keep them on published images. */
  private canDrawLines(topoImage: TopoImage): boolean {
    if (topoImage.publicationStatus === 'draft') {
      return topoImage.createdById === this.currentUserId;
    }
    return this.canContributeTopo;
  }

  /** Reorder stays with the draft owner. On a published image it stays a moderator action. */
  private canReorderLines(topoImage: TopoImage): boolean {
    if (topoImage.publicationStatus === 'draft') {
      return topoImage.createdById === this.currentUserId;
    }
    return this.viewerIsModerator;
  }

  /** A moderator reviewing someone else's draft can open it for acceptance. */
  private canAcceptDraft(topoImage: TopoImage): boolean {
    return (
      this.viewerIsModerator &&
      topoImage.publicationStatus === 'draft' &&
      topoImage.createdById !== this.currentUserId
    );
  }

  /**
   * Owners delete their drafts. Moderators delete published images, not someone else's draft.
   */
  canDelete(topoImage: TopoImage): boolean {
    if (topoImage.publicationStatus === 'draft') {
      return topoImage.createdById === this.currentUserId;
    }
    return this.viewerIsModerator;
  }

  editTopoImage(topoImage: TopoImage) {
    if (
      this.viewerIsModerator &&
      topoImage.publicationStatus === 'draft' &&
      topoImage.createdById !== this.currentUserId
    ) {
      this.router.navigate(['/suggestions']);
      return;
    }
    this.router.navigate([
      '/topo',
      this.cragSlug,
      this.sectorSlug,
      this.areaSlug,
      'topo-images',
      topoImage.id,
      'edit',
    ]);
  }

  toggleArchive() {
    this.showArchive = !this.showArchive;
    this.refreshData();
  }

  /**
   * Loads new data.
   */
  refreshData() {
    this.loading = LoadingState.LOADING;
    const params: ApiQueryParams = {};
    if (this.showArchive) {
      params.archived = '1';
    }
    this.areasService
      .getArea(this.areaSlug)
      .pipe(
        mergeMap((area) => {
          return forkJoin([
            this.topoImagesService.getTopoImages(this.areaSlug, params),
            this.ticksService.getTicks(null, null, area.id),
          ]);
        }),
      )
      .subscribe(([topoImages, ticks]) => {
        this.ticks = ticks;
        this.topoImages = topoImages;
        this.loading = LoadingState.DEFAULT;
        this.sortOptions = [
          {
            icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT,
            label: this.translocoService.translate(marker('sortAscending')),
            value: '!orderIndex',
          },
          {
            icon: PrimeIcons.SORT_AMOUNT_DOWN,
            label: this.translocoService.translate(marker('sortDescending')),
            value: 'orderIndex',
          },
        ];
        this.sortKey = this.sortOptions[0];
        if (this.scrollTarget) {
          this.restoreScrollPosition();
        } else {
          this.scrollToAnchor();
        }
      });
  }

  restoreScrollPosition() {
    if (this.scrollTarget && this.loading === LoadingState.DEFAULT) {
      // CDR not working as expected here because topo image is using setTimeout because of konva bug...
      // So I have to use setTimeout too
      setTimeout(() => {
        this.viewportScroller.scrollToPosition(this.scrollTarget.position);
        this.scrollTarget = null;
      });
    }
  }

  /**
   * Scrolls the topo image identified by the URL fragment to the top.
   *
   * Canvases grow after the first paint and again when the photo decodes,
   * which pushes the target down. Keep pulling it back until that settles,
   * unless the user starts scrolling.
   */
  scrollToAnchor() {
    this.stopAnchorScroll?.();
    this.stopAnchorScroll = null;

    const fragment = this.route.snapshot.fragment;
    if (!fragment) {
      return;
    }

    let timer = 0;
    let attempts = 0;
    const stop = () => {
      window.clearInterval(timer);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      if (this.stopAnchorScroll === stop) {
        this.stopAnchorScroll = null;
      }
    };
    timer = window.setInterval(() => {
      attempts += 1;
      const element = document.getElementById(fragment);
      if (!element || attempts > 25) {
        stop();
        return;
      }
      const top = element.getBoundingClientRect().top;
      if (Math.abs(top) > 2) {
        window.scrollBy(0, top);
      }
    }, 200);
    this.stopAnchorScroll = stop;

    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
  }

  openVideo(event: MouseEvent, line: Line) {
    event.preventDefault();
    event.stopPropagation();
    if (line.videos.length > 0) {
      window.open(line.videos[0].url);
    }
  }

  openComments(event: MouseEvent, line: Line) {
    event.preventDefault();
    event.stopPropagation();
    void this.router.navigateByUrl(
      `/topo/${this.cragSlug}/${this.sectorSlug}/${this.areaSlug}/${line.slug}/comments`,
    );
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    const value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

  /**
   * Opens the overflow menu for one topo image.
   */
  openTopoImageActions(event: Event, topoImage: TopoImage) {
    this.actionAnchor = event.currentTarget ?? event.target;
    this.topoImageActionItems = this.buildTopoImageActionItems(topoImage);
    this.topoImageMenu.toggle(event);
  }

  private buildTopoImageActionItems(topoImage: TopoImage): MenuItem[] {
    const archived = topoImage.publicationStatus === 'archived';
    const items: MenuItem[] = [];

    if (this.canDrawLines(topoImage)) {
      items.push(
        {
          id: 'edit-line-paths',
          label: this.translocoService.translate(
            this.viewerIsModerator
              ? marker('topoImage.topoImageList.editLinePathsButtonLabel')
              : marker('topoImage.topoImageList.suggestLinePathsButtonLabel'),
          ),
          icon: 'pi pi-fw pi-share-alt',
          command: () => {
            void this.router.navigate([
              '/topo',
              this.cragSlug,
              this.sectorSlug,
              this.areaSlug,
              'topo-images',
              topoImage.id,
              'edit-line-paths',
            ]);
          },
        },
        {
          id: 'create-line',
          label: this.translocoService.translate(
            this.viewerIsModerator
              ? marker('topoImage.topoImageList.createLineButtonLabel')
              : marker('topoImage.topoImageList.suggestLineButtonLabel'),
          ),
          icon: 'pi pi-fw pi-plus',
          command: () => {
            void this.router.navigate(
              [
                '/topo',
                this.cragSlug,
                this.sectorSlug,
                this.areaSlug,
                'create-line',
              ],
              { queryParams: { drawOnTopoImage: topoImage.id } },
            );
          },
        },
      );
    }

    if (this.canReorderLines(topoImage)) {
      items.push({
        id: 'reorder-line-paths',
        label: this.translocoService.translate(
          marker('topoImage.topoImageList.reorderLinePathsButtonLabel'),
        ),
        icon: 'pi pi-fw pi-sort',
        disabled: (topoImage.linePaths?.length ?? 0) < 2,
        command: () => {
          this.reorderLinePaths(topoImage);
        },
      });
    }

    if (this.canAcceptDraft(topoImage)) {
      items.push({
        id: 'accept-draft',
        label: this.translocoService.translate(marker('suggestions.review')),
        icon: 'pi pi-fw pi-check',
        command: () => {
          this.editTopoImage(topoImage);
        },
      });
    }

    if (this.canManage(topoImage)) {
      items.push({
        id: 'edit-topo-image',
        label: this.translocoService.translate(
          marker('topoImage.topoImageList.editTopoImageButtonLabel'),
        ),
        icon: 'pi pi-fw pi-pencil',
        command: () => {
          this.editTopoImage(topoImage);
        },
      });
    }

    const destructive: MenuItem[] = [];
    if (this.canArchive(topoImage)) {
      destructive.push({
        id: 'archive-topo-image',
        label: this.translocoService.translate(
          archived
            ? marker('archiveButton.unarchive')
            : marker('archiveButton.archive'),
        ),
        icon: archived ? 'pi pi-fw pi-undo' : 'pi pi-fw pi-hammer',
        command: (menuEvent) => {
          this.confirmArchiveTopoImage(
            this.actionConfirmEvent(menuEvent.originalEvent),
            topoImage,
          );
        },
      });
    }
    if (this.canDelete(topoImage)) {
      destructive.push({
        id: 'delete-topo-image',
        label: this.translocoService.translate(
          marker('topoImage.topoImageList.deleteTopoImageButtonLabel'),
        ),
        icon: 'pi pi-fw pi-trash',
        styleClass: 'topo-image-menu-danger',
        command: (menuEvent) => {
          this.confirmDeleteTopoImage(
            this.actionConfirmEvent(menuEvent.originalEvent),
            topoImage,
          );
        },
      });
    }
    if (items.length > 0 && destructive.length > 0) {
      items.push({ separator: true });
    }
    items.push(...destructive);
    return items;
  }

  /** Archive is a gym-mode moderator action, and drafts cannot be archived. */
  private canArchive(topoImage: TopoImage): boolean {
    return (
      this.viewerIsModerator &&
      this.gymMode &&
      (topoImage.publicationStatus === 'published' ||
        topoImage.publicationStatus === 'archived')
    );
  }

  private actionConfirmEvent(fallback: Event | undefined): Event {
    if (this.actionAnchor) {
      return { target: this.actionAnchor } as Event;
    }
    return fallback ?? new Event('click');
  }

  /**
   * Asks whether linked lines should be archived together with the image.
   */
  confirmArchiveTopoImage(event: Event, topoImage: TopoImage) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translocoService.translate(
        topoImage.publicationStatus === 'archived'
          ? marker('archive.askAlsoUnArchiveLines')
          : marker('archive.askAlsoArchiveLines'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('archive.yesWithLines'),
      ),
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      rejectLabel: this.translocoService.translate(
        marker('archive.noWithoutLines'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.archiveTopoImage(topoImage, true);
      },
      reject: () => {
        this.archiveTopoImage(topoImage, false);
      },
    });
  }

  private archiveTopoImage(topoImage: TopoImage, cascadeToLines: boolean) {
    const previous = topoImage.publicationStatus;
    const nextArchived = previous !== 'archived';
    topoImage.publicationStatus = nextArchived ? 'archived' : 'published';
    this.archiveService
      .changeTopoImageArchived(topoImage, cascadeToLines)
      .subscribe({
        next: () => {
          this.store.dispatch(
            toastNotification(nextArchived ? 'ARCHIVED' : 'UNARCHIVED'),
          );
        },
        error: () => {
          topoImage.publicationStatus = previous;
          this.store.dispatch(
            toastNotification(
              nextArchived ? 'ARCHIVED_ERROR' : 'UNARCHIVED_ERROR',
            ),
          );
        },
      });
  }

  /**
   * Asks if the line should really get deleted.
   * @param event Click event.
   * @param topoImage Topo image to delete.
   */
  confirmDeleteTopoImage(event: Event, topoImage: TopoImage) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('topoImage.askReallyWantToDeleteTopoImage'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('topoImage.yesDelete'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('topoImage.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteTopoImage(topoImage);
      },
    });
  }

  /**
   * Deletes the line.
   * @param topoImage The topo image that is deleted.
   */
  public deleteTopoImage(topoImage: TopoImage) {
    topoImage.loadingState = LoadingState.LOADING;
    this.topoImagesService
      .deleteTopoImage(this.areaSlug, topoImage)
      .subscribe(() => {
        this.store.dispatch(toastNotification('TOPO_IMAGE_DELETED'));
        this.topoImages.splice(this.topoImages.indexOf(topoImage), 1);
        this.topoImages = [...this.topoImages];
        topoImage.loadingState = LoadingState.DEFAULT;
      });
  }

  /**
   * Asks if the line path should really get deleted.
   * @param event Click event.
   * @param linePath Line path to delete.
   * @param topoImage that the line path was assigned to.
   */
  confirmDeleteLinePath(
    event: Event,
    linePath: LinePath,
    topoImage: TopoImage,
  ) {
    event.stopPropagation();
    event.preventDefault();
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('topoImage.askReallyWantToDeleteLinePath'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('topoImage.yesDelete'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('topoImage.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteLinePath(linePath, topoImage);
      },
    });
  }

  /**
   * Deletes the line path.
   * @param linePath The line path that is deleted.
   * @param topoImage The topo image the line path belonged to.
   */
  public deleteLinePath(linePath: LinePath, topoImage: TopoImage) {
    linePath.loadingState = LoadingState.LOADING;
    this.linePathsService.deleteLinePath(linePath).subscribe(() => {
      this.store.dispatch(toastNotification('LINE_PATH_DELETED'));
      topoImage.linePaths.splice(topoImage.linePaths.indexOf(linePath), 1);
      linePath.konvaLine.destroy();
      linePath.konvaTabuShapes?.forEach((shape) => shape.destroy());
      linePath.konvaRect.destroy();
      linePath.konvaText.destroy();
      linePath.loadingState = LoadingState.DEFAULT;
    });
  }

  primaryLinePaths(topoImage: TopoImage): LinePath[] {
    return primaryTopoLinePaths(topoImage.linePaths);
  }

  variantLinePaths(topoImage: TopoImage): LinePath[] {
    return variantTopoLinePaths(topoImage.linePaths);
  }

  variantCount(topoImage: TopoImage): number {
    return variantTopoLinePaths(topoImage.linePaths).length;
  }

  /** Mixed images can collapse variants. An image of only variants cannot. */
  canHideVariants(topoImage: TopoImage): boolean {
    return topoImageCanHideVariants(topoImage.linePaths);
  }

  variantsExpanded(topoImage: TopoImage): boolean {
    return this.expandedVariantImageIds.has(topoImage.id);
  }

  /** Variants are listed when opened, or when the image has nothing else to show. */
  variantsShown(topoImage: TopoImage): boolean {
    return (
      this.variantCount(topoImage) > 0 &&
      (!this.canHideVariants(topoImage) || this.variantsExpanded(topoImage))
    );
  }

  toggleVariants(topoImage: TopoImage): void {
    if (this.variantsExpanded(topoImage)) {
      this.expandedVariantImageIds.delete(topoImage.id);
      return;
    }
    this.expandedVariantImageIds.add(topoImage.id);
  }

  /** Same label as on the image: 1, 2, 3… for lines and V1, V2… for variants. */
  lineNumber(linePath: LinePath, topoImage: TopoImage): string {
    return topoLinePathDisplayNumbers(topoImage.linePaths).get(linePath) ?? '1';
  }

  /**
   * Highlights the passes line path on the topo image.
   * @param linePath Line path to highlight.
   * @param topoImage Topo image that the path is a part of. Needed for getting the correct z-index.
   */
  highlightLinePath(linePath: LinePath, topoImage: TopoImage) {
    if (linePath.konvaLine) {
      this.store
        .select(selectInstanceSettingsState)
        .pipe(take(1))
        .subscribe((instanceSettingsState) => {
          linePath.konvaLine.fill(
            highlightColor(linePath.line?.color) ??
              instanceSettingsState.arrowHighlightColor,
          );
          linePath.konvaLine.stroke(
            highlightColor(linePath.line?.color) ??
              instanceSettingsState.arrowHighlightColor,
          );
          linePath.konvaLine.zIndex(topoImage.linePaths.length);
          linePath.konvaRect.fill(
            highlightColor(linePath.line?.color) ??
              instanceSettingsState.arrowHighlightColor,
          );
          linePath.konvaText.fill(
            textColor(highlightColor(linePath.line?.color)) ??
              instanceSettingsState.arrowHighlightTextColor,
          );
          linePath.konvaFocusLayer.add(linePath.konvaLine);
          linePath.konvaFocusLayer.add(linePath.konvaNumberGroup);
          linePath.konvaTabuShapes?.forEach((shape) => {
            shape.visible(true);
            linePath.konvaFocusLayer.add(shape);
            shape.moveToBottom();
          });
        });
    }
  }

  /**
   * Un-highlights the passed line path.
   * @param linePath Line path to un-highlight.
   */
  unhighlightLinePath(linePath: LinePath) {
    if (linePath.konvaLine) {
      this.store
        .select(selectInstanceSettingsState)
        .pipe(take(1))
        .subscribe((instanceSettingsState) => {
          linePath.konvaLine.fill(
            linePath.line?.color ?? instanceSettingsState.arrowColor,
          );
          linePath.konvaLine.stroke(
            linePath.line?.color ?? instanceSettingsState.arrowColor,
          );
          linePath.konvaLine.zIndex(1); // 0 is the BG image
          linePath.konvaRect.fill(
            linePath.line?.color ?? instanceSettingsState.arrowColor,
          );
          linePath.konvaText.fill(
            textColor(linePath.line?.color) ??
              instanceSettingsState.arrowTextColor,
          );
          linePath.konvaLineLayer.add(linePath.konvaLine);
          linePath.konvaNumberLayer.add(linePath.konvaNumberGroup);
          linePath.konvaTabuShapes?.forEach((shape) => {
            linePath.konvaLineLayer.add(shape);
            shape.moveToBottom();
            shape.moveUp();
            if (linePath.tabuHoldsHiddenUntilHover) {
              shape.visible(false);
            }
          });
        });
    }
  }

  /**
   * Opens the reordering dialog for the topo images.
   */
  reorderTopoImages() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      modal: true,
      header: this.translocoService.translate(
        marker('reorderTopoImagesDialogTitle'),
      ),
      data: {
        items: this.topoImages,
        itemsName: this.translocoService.translate(
          marker('reorderTopoImagesDialogItemsName'),
        ),
        callback: this.topoImagesService.updateTopoImageOrder.bind(
          this.topoImagesService,
        ),
        slugParameter: this.areaSlug,
        showImage: true,
      },
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshData();
    });
  }

  /**
   * Opens the reordering dialog for the line paths.
   *
   * @param topoImage Topo image for which to order the lines.
   */
  reorderLinePaths(topoImage: TopoImage) {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      modal: true,
      header: this.translocoService.translate(
        marker('reorderLinePathsDialogTitle'),
      ),
      data: {
        items: topoImage.linePaths,
        itemsName: this.translocoService.translate(
          marker('reorderLinePathsDialogItemsName'),
        ),
        callback: this.linePathsService.updateLinePathOrder.bind(
          this.linePathsService,
        ),
        slugParameter: topoImage.id,
        showLinePathLineName: true,
      },
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshData();
    });
  }

  protected readonly highlightColor = highlightColor;
}
