import {
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Line } from '../../../models/line';
import { LinesService } from '../../../services/crud/lines.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LinePathsService } from '../../../services/crud/line-paths.service';
import { TicksService } from '../../../services/crud/ticks.service';
import { Actions, ofType } from '@ngrx/effects';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { IsTodoService } from '../../../services/crud/is-todo.service';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { todoAdded } from '../../../ngrx/actions/todo.actions';
import { ClosedSpotAlertComponent } from '../../shared/components/closed-spot-alert/closed-spot-alert.component';
import { UpcomingClosureAlertComponent } from '../../shared/components/upcoming-closure-alert/upcoming-closure-alert.component';
import { TopoImageDetailsComponent } from '../../topo-images/topo-image-details/topo-image-details.component';
import { Button } from 'primeng/button';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Rating } from 'primeng/rating';
import { ArchiveButtonComponent } from '../../archive/archive-button/archive-button.component';
import { TodoButtonComponent } from '../../todo/todo-button/todo-button.component';
import { FormsModule } from '@angular/forms';
import { TickButtonComponent } from '../../ascent/tick-button/tick-button.component';
import { Skeleton } from 'primeng/skeleton';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { LineBoolPropListComponent } from '../line-bool-prop-list/line-bool-prop-list.component';
import { TopoImageViewerComponent } from '../../shared/components/topo-image/topo-image-viewer.component';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { ConfirmationService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GalleriaModule } from 'primeng/galleria';
import {
  GalleryPreviewDirection,
  galleryPreviewSwipeDirection,
  stepGalleryPreview,
} from '../../../utility/gallery-preview';

/**
 * Component that shows detailed information about a line.
 */
@Component({
  selector: 'lc-line-info',
  templateUrl: './line-info.component.html',
  styleUrls: ['./line-info.component.scss'],
  providers: [DialogService, ConfirmationService],
  imports: [
    ClosedSpotAlertComponent,
    UpcomingClosureAlertComponent,
    TranslocoDirective,
    TopoImageDetailsComponent,
    Button,
    HasPermissionDirective,
    Rating,
    ArchiveButtonComponent,
    TodoButtonComponent,
    FormsModule,
    TickButtonComponent,
    Skeleton,
    SanitizeHtmlPipe,
    LineBoolPropListComponent,
    TopoImageViewerComponent,
    DatePipe,
    LineGradePipe,
    RouterLink,
    GalleriaModule,
  ],
})
export class LineInfoComponent implements OnInit {
  public line: Line;
  public ref: DynamicDialogRef | undefined;
  public ticks: Set<string>;
  public todos: Set<string>;
  public displayUserRating?: boolean = undefined;
  public displayUserGrades?: boolean = undefined;
  public topoPreviewVisible = false;
  public topoPreviewIndex = 0;

  private lineSlug: string;
  private topoPreviewTouch: { x: number; y: number } | null = null;
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private ticksService = inject(TicksService);
  private isTodoService = inject(IsTodoService);
  private actions$ = inject(Actions);
  private translocoService = inject(TranslocoService);
  private dialogService = inject(DialogService);
  private linePathsService = inject(LinePathsService);
  private linesService = inject(LinesService);
  private store = inject(Store);

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.line = null;
        this.lineSlug = this.route.snapshot.paramMap.get('line-slug');
        this.refreshData();
      });
    this.actions$
      .pipe(
        ofType(reloadAfterAscent, todoAdded),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.refreshData();
      });
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.displayUserRating = instanceSettings.displayUserRatings;
        this.displayUserGrades = instanceSettings.displayUserGrades;
      });
  }

  /**
   * Loads the line data.
   */
  refreshData() {
    this.linesService
      .getLine(this.lineSlug)
      .pipe(
        switchMap((line) => {
          this.line = line;
          return forkJoin({
            ticks: this.ticksService.getTicks(null, null, null, [line.id]),
            todos: this.isTodoService.getIsTodo(null, null, null, [line.id]),
          });
        }),
      )
      .subscribe(({ ticks, todos }) => {
        this.ticks = ticks;
        this.todos = todos;
      });
  }

  /**
   * Opens the full-size topo preview for one of this line's images.
   * List pages do not enable the control, so their row links keep working.
   */
  openTopoPreview(index: number) {
    if (!this.line?.topoImages?.length) {
      return;
    }
    this.topoPreviewTouch = null;
    this.topoPreviewIndex = index;
    this.topoPreviewVisible = true;
  }

  canStepTopoPreview(direction: GalleryPreviewDirection): boolean {
    return (
      stepGalleryPreview({
        index: this.topoPreviewIndex,
        count: this.line?.topoImages?.length ?? 0,
        hasNextPage: false,
        direction,
      }) !== null
    );
  }

  stepTopoPreview(direction: GalleryPreviewDirection, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    const step = stepGalleryPreview({
      index: this.topoPreviewIndex,
      count: this.line?.topoImages?.length ?? 0,
      hasNextPage: false,
      direction,
    });
    if (!step || step.type !== 'move') {
      return;
    }
    this.topoPreviewIndex = step.index;
  }

  onTopoPreviewTouchStart(event: TouchEvent) {
    if (
      event.touches.length !== 1 ||
      this.topoPreviewTouchStartedOnButton(event)
    ) {
      this.topoPreviewTouch = null;
      return;
    }
    const touch = event.touches[0];
    this.topoPreviewTouch = { x: touch.clientX, y: touch.clientY };
  }

  onTopoPreviewTouchEnd(event: TouchEvent) {
    const start = this.topoPreviewTouch;
    this.topoPreviewTouch = null;
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
    this.stepTopoPreview(direction, event);
  }

  onTopoPreviewTouchCancel() {
    this.topoPreviewTouch = null;
  }

  @HostListener('document:keydown', ['$event'])
  onTopoPreviewKeydown(event: KeyboardEvent) {
    if (!this.topoPreviewVisible) {
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.topoPreviewVisible = false;
      this.topoPreviewTouch = null;
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.stepTopoPreview(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.stepTopoPreview(-1);
    }
  }

  /**
   * Opens the reordering dialog for the line paths.
   */
  reorderLinePaths() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      modal: true,
      header: this.translocoService.translate(
        marker('reorderLinePathsForLineDialogTitle'),
      ),
      data: {
        items: this.line.topoImages,
        itemsName: this.translocoService.translate(
          marker('reorderLinePathsForLineDialogItemsName'),
        ),
        callback: this.linePathsService.updateLinePathOrderForLines.bind(
          this.linePathsService,
        ),
        slugParameter: this.line.slug,
        showImage: true,
        idAccessor: (item: any) => item.linePaths[0].id,
      },
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshData();
    });
  }

  private topoPreviewTouchStartedOnButton(event: TouchEvent): boolean {
    const target = event.target;
    return target instanceof Element && !!target.closest('button');
  }
}
