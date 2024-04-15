import {ChangeDetectorRef, Component} from '@angular/core';
import {Area} from '../../../models/area';
import {ActivatedRoute} from '@angular/router';
import {AreasService} from '../../../services/crud/areas.service';
import {Line} from '../../../models/line';
import {LinesService} from '../../../services/crud/lines.service';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {TopoImage} from '../../../models/topo-image';
import {OrderItemsComponent} from '../../shared/components/order-items/order-items.component';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TranslocoService} from '@ngneat/transloco';
import {LinePathsService} from '../../../services/crud/line-paths.service';
import {forkJoin, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {ApiService} from '../../../services/core/api.service';
import {CacheService} from '../../../services/core/cache.service';
import {TicksService} from '../../../services/crud/ticks.service';
import {Actions, ofType} from '@ngrx/effects';
import {reloadAfterAscent} from '../../../ngrx/actions/ascent.actions';

/**
 * Component that shows detailed information about a line.
 */
@Component({
  selector: 'lc-line-info',
  templateUrl: './line-info.component.html',
  styleUrls: ['./line-info.component.scss'],
  providers: [
    DialogService
  ]
})
@UntilDestroy()
export class LineInfoComponent {

  public line: Line;
  public ref: DynamicDialogRef | undefined;
  public ticks: Set<string>;

  private lineSlug: string;
  private areaSlug: string;

  constructor(private route: ActivatedRoute,
              private store: Store,
              private ticksService: TicksService,
              private api: ApiService,
              private actions$: Actions,
              private cache: CacheService,
              private translocoService: TranslocoService,
              private dialogService: DialogService,
              private linePathsService: LinePathsService,
              private linesService: LinesService) {
  }

  ngOnInit() {
    this.lineSlug = this.route.snapshot.paramMap.get('line-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    this.refreshData();
    this.actions$.pipe(ofType(reloadAfterAscent), untilDestroyed(this)).subscribe(()=>{
      this.refreshData();
    });
  }

  /**
   * Loads the line data.
   */
  refreshData() {
    this.linesService.getLine(this.lineSlug).subscribe(line => {
      this.line = line;
      this.ticksService.getTicks(null, null, null, line.id).subscribe(ticks => {
        this.ticks = ticks;
      })
    });
  }

  /**
   * Opens the reordering dialog for the line paths.
   */
  reorderLinePaths() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      header: this.translocoService.translate(marker('reorderLinePathsForLineDialogTitle')),
      data: {
        items: this.line.topoImages,
        itemsName: this.translocoService.translate(marker('reorderLinePathsForLineDialogItemsName')),
        callback: this.linePathsService.updateLinePathOrderForLines.bind(this.linePathsService),
        slugParameter: this.line.slug,
        showImage: true,
        idAccessor: (item: any) => item.linePaths[0].id
      }
    });
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshData();
      this.cache.clear(this.api.lines.getList(this.areaSlug));
    });
  }

}
