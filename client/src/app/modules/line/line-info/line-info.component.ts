import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { AsyncPipe } from '@angular/common';
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
import { TopoImageComponent } from '../../shared/components/topo-image/topo-image.component';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { ScalesService } from '../../../services/crud/scales.service';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { ConfirmationService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    TopoImageComponent,
    AsyncPipe,
    DatePipe,
  ],
})
export class LineInfoComponent implements OnInit {
  public line: Line;
  public ref: DynamicDialogRef | undefined;
  public ticks: Set<string>;
  public todos: Set<string>;
  public displayUserRating?: boolean = undefined;
  public displayUserGrades?: boolean = undefined;

  private lineSlug: string;
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

  protected scalesService = inject(ScalesService);

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
}
