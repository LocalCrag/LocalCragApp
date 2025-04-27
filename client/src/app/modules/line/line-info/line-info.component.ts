import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Line } from '../../../models/line';
import { LinesService } from '../../../services/crud/lines.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
import { SharedModule } from '../../shared/shared.module';
import { NgForOf, NgIf } from '@angular/common';
import { TopoImageDetailsComponent } from '../../topo-images/topo-image-details/topo-image-details.component';
import { Button } from 'primeng/button';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { LineModule } from '../line.module';
import { Rating } from 'primeng/rating';
import { ArchiveButtonComponent } from '../../archive/archive-button/archive-button.component';
import { TodoButtonComponent } from '../../todo/todo-button/todo-button.component';
import { FormsModule } from '@angular/forms';
import { TickButtonComponent } from '../../ascent/tick-button/tick-button.component';
import { Skeleton } from 'primeng/skeleton';

/**
 * Component that shows detailed information about a line.
 */
@Component({
  selector: 'lc-line-info',
  templateUrl: './line-info.component.html',
  styleUrls: ['./line-info.component.scss'],
  providers: [DialogService],
  imports: [
    ClosedSpotAlertComponent,
    TranslocoDirective,
    SharedModule,
    NgIf,
    TopoImageDetailsComponent,
    Button,
    HasPermissionDirective,
    NgForOf,
    LineModule,
    Rating,
    ArchiveButtonComponent,
    TodoButtonComponent,
    FormsModule,
    TickButtonComponent,
    Skeleton,
  ],
})
@UntilDestroy()
export class LineInfoComponent implements OnInit {
  public line: Line;
  public ref: DynamicDialogRef | undefined;
  public ticks: Set<string>;
  public todos: Set<string>;

  private lineSlug: string;

  constructor(
    private route: ActivatedRoute,
    private ticksService: TicksService,
    private isTodoService: IsTodoService,
    private actions$: Actions,
    private translocoService: TranslocoService,
    private dialogService: DialogService,
    private linePathsService: LinePathsService,
    private linesService: LinesService,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      this.line = null;
      this.lineSlug = this.route.snapshot.paramMap.get('line-slug');
      this.refreshData();
    });
    this.actions$
      .pipe(ofType(reloadAfterAscent, todoAdded), untilDestroyed(this))
      .subscribe(() => {
        this.refreshData();
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
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshData();
    });
  }
}
