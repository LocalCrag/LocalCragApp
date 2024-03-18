import {ChangeDetectorRef, Component, ViewEncapsulation} from '@angular/core';
import {LoadingState} from '../../../enums/loading-state';
import {ConfirmationService, PrimeIcons, SelectItem} from 'primeng/api';
import {forkJoin, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {ActivatedRoute, Router, Scroll} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {TopoImage} from '../../../models/topo-image';
import {TopoImagesService} from '../../../services/crud/topo-images.service';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {LinePath} from '../../../models/line-path';
import {LinePathsService} from '../../../services/crud/line-paths.service';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {OrderItemsComponent} from '../../shared/components/order-items/order-items.component';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ApiService} from '../../../services/core/api.service';
import {CacheService} from '../../../services/core/cache.service';
import {ViewportScroller} from '@angular/common';
import {filter} from 'rxjs/operators';
import {Line} from '../../../models/line';

/**
 * Component that lists all topo images in an area.
 */
@Component({
  selector: 'lc-topo-image-list',
  templateUrl: './topo-image-list.component.html',
  styleUrls: ['./topo-image-list.component.scss'],
  providers: [
    ConfirmationService,
    DialogService
  ],
  encapsulation: ViewEncapsulation.None
})
@UntilDestroy()
export class TopoImageListComponent {

  public topoImages: TopoImage[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isLoggedIn$: Observable<boolean>;
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public sectorSlug: string;
  public areaSlug: string;
  public ref: DynamicDialogRef | undefined;

  private scrollTarget: Scroll;

  constructor(private topoImagesService: TopoImagesService,
              private api: ApiService,
              private cache: CacheService,
              private store: Store,
              private confirmationService: ConfirmationService,
              private dialogService: DialogService,
              private linePathsService: LinePathsService,
              private route: ActivatedRoute,
              private translocoService: TranslocoService,
              private router: Router,
              private viewportScroller: ViewportScroller) {
    this.router.events.pipe(filter((event): event is Scroll => event instanceof Scroll)
    ).subscribe((e) => {
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
    this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.parent.parent.snapshot.paramMap.get('area-slug');
    this.refreshData();
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  /**
   * Loads new data.
   */
  refreshData() {
    this.loading = LoadingState.LOADING;
    forkJoin([
      this.topoImagesService.getTopoImages(this.areaSlug),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([topoImages, e]) => {
      this.topoImages = topoImages;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT, label: this.translocoService.translate(marker('sortAscending')), value: '!orderIndex'},
        {icon: PrimeIcons.SORT_AMOUNT_DOWN, label: this.translocoService.translate(marker('sortDescending')), value: 'orderIndex'},
      ];
      this.sortKey = this.sortOptions[0];
      this.restoreScrollPosition();
    });
  }

  restoreScrollPosition(){
    if(this.scrollTarget && this.loading === LoadingState.DEFAULT){
      // CDR not working as expected here because topo image is using setTimeout because of konva bug...
      // So I have to use setTimeout too
      setTimeout(()=>{
        this.viewportScroller.scrollToPosition(this.scrollTarget.position);
        this.scrollTarget = null;
      })
    }
  }

  openVideo(event: MouseEvent, line: Line){
    event.preventDefault();
    event.stopPropagation();
    if(line.videos.length > 0){
      window.open(line.videos[0].url);
    }
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    let value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

  /**
   * Asks if the line should really get deleted.
   * @param event Click event.
   * @param topoImage Topo image to delete.
   */
  confirmDeleteTopoImage(event: Event, topoImage: TopoImage) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('topoImage.askReallyWantToDeleteTopoImage')),
        acceptLabel: this.translocoService.translate(marker('topoImage.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('topoImage.noDontDelete')),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteTopoImage(topoImage);
        },
      });
    });
  }

  /**
   * Deletes the line.
   * @param topoImage The topo image that is deleted.
   */
  public deleteTopoImage(topoImage: TopoImage) {
    topoImage.loadingState = LoadingState.LOADING;
    this.topoImagesService.deleteTopoImage(this.areaSlug, topoImage).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.TOPO_IMAGE_DELETED));
      this.topoImages.splice(this.topoImages.indexOf(topoImage), 1)
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
  confirmDeleteLinePath(event: Event, linePath: LinePath, topoImage: TopoImage) {
    event.stopPropagation();
    event.preventDefault();
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('topoImage.askReallyWantToDeleteLinePath')),
        acceptLabel: this.translocoService.translate(marker('topoImage.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('topoImage.noDontDelete')),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteLinePath(linePath, topoImage);
        },
      });
    });
  }

  /**
   * Deletes the line path.
   * @param linePath The line path that is deleted.
   * @param topoImage The topo image the line path belonged to.
   */
  public deleteLinePath(linePath: LinePath, topoImage: TopoImage) {
    linePath.loadingState = LoadingState.LOADING;
    this.linePathsService.deleteLinePath(this.areaSlug, linePath, topoImage.id).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.LINE_PATH_DELETED));
      topoImage.linePaths.splice(topoImage.linePaths.indexOf(linePath), 1)
      linePath.konvaLine.destroy();
      linePath.konvaRect.destroy();
      linePath.konvaText.destroy();
      linePath.loadingState = LoadingState.DEFAULT;
    });
  }

  /**
   * Highlights the passes line path on the topo image.
   * @param linePath Line path to highlight.
   * @param topoImage Topo image that the path is a part of. Needed for getting the correct z-index.
   */
  highlightLinePath(linePath: LinePath, topoImage: TopoImage) {
    if (linePath.konvaLine) {
      linePath.konvaLine.fill(environment.arrowHighlightColor);
      linePath.konvaLine.stroke(environment.arrowHighlightColor);
      linePath.konvaLine.zIndex(topoImage.linePaths.length);
      linePath.konvaRect.fill(environment.arrowHighlightColor);
      linePath.konvaText.fill(environment.arrowHighlightTextColor)
    }
  }

  /**
   * Un-highlights the passed line path.
   * @param linePath Line path to un-highlight.
   */
  unhighlightLinePath(linePath: LinePath) {
    if (linePath.konvaLine) {
      linePath.konvaLine.fill(environment.arrowColor);
      linePath.konvaLine.stroke(environment.arrowColor);
      linePath.konvaLine.zIndex(1); // 0 is the BG image
      linePath.konvaRect.fill(environment.arrowColor);
      linePath.konvaText.fill(environment.arrowTextColor)
    }
  }

  /**
   * Opens the reordering dialog for the topo images.
   */
  reorderTopoImages() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      header: this.translocoService.translate(marker('reorderTopoImagesDialogTitle')),
      data: {
        items: this.topoImages,
        itemsName: this.translocoService.translate(marker('reorderTopoImagesDialogItemsName')),
        callback: this.topoImagesService.updateTopoImageOrder.bind(this.topoImagesService),
        slugParameter: this.areaSlug,
        showImage: true
      }
    });
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
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
      header: this.translocoService.translate(marker('reorderLinePathsDialogTitle')),
      data: {
        items: topoImage.linePaths,
        itemsName: this.translocoService.translate(marker('reorderLinePathsDialogItemsName')),
        callback: this.linePathsService.updateLinePathOrder.bind(this.linePathsService),
        slugParameter: topoImage.id,
        showLinePathLineName: true
      }
    });
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.cache.clear(this.api.topoImages.getList(this.areaSlug));
      this.cache.clear(this.api.lines.getList(this.areaSlug));
      this.refreshData();
    });
  }

  protected readonly environment = environment;
}
