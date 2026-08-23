import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FeatureCollection, Geometry } from 'geojson';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule, TablePageEvent } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { RockExplorerUiService } from '../rock-explorer-ui.service';
import {
  RockExplorerListRow,
  compareRockExplorerListRows,
  formatRockExplorerAreaSqM,
  rockExplorerFeaturesToListRows,
} from './rock-explorer-list-rows';

type SortField = keyof Pick<
  RockExplorerListRow,
  'title' | 'potential' | 'rockQuality' | 'rockType' | 'areaSqM'
>;

/** Row with display strings precomputed once per view rebuild. */
export type RockExplorerListDisplayRow = RockExplorerListRow & {
  displayTitle: string;
  displayPotential: string;
  displayRockQuality: string;
  displayRockType: string;
  displayArea: string;
  potentialColor: string;
};

@Component({
  selector: 'lc-rock-explorer-list',
  imports: [
    FormsModule,
    TranslocoDirective,
    Button,
    InputText,
    Select,
    TableModule,
    Tag,
  ],
  templateUrl: './rock-explorer-list.component.html',
  styleUrl: './rock-explorer-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RockExplorerListComponent implements OnChanges {
  @Input({ required: true }) features!: FeatureCollection<Geometry>;

  readonly ui = inject(RockExplorerUiService);
  private transloco = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  titleQuery = '';
  titleQueryInput = '';
  potentialFilter: string | null = null;
  rockQualityFilter: string | null = null;
  rockTypeFilter: string | null = null;
  hasActiveFilters = false;

  sortField: SortField = 'title';
  sortOrder: 1 | -1 = 1;
  first = 0;
  rows = 25;

  /** Pre-filtered, sorted, display-ready rows — rebuilt only when inputs change. */
  viewRows: RockExplorerListDisplayRow[] = [];

  readonly sortIcons: Record<SortField, string> = {
    title: 'pi pi-sort-alt',
    potential: 'pi pi-sort-alt',
    rockQuality: 'pi pi-sort-alt',
    rockType: 'pi pi-sort-alt',
    areaSqM: 'pi pi-sort-alt',
  };

  private allRows: RockExplorerListRow[] = [];
  private titleQueryUpdate = new Subject<string>();

  constructor() {
    this.titleQueryUpdate
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.titleQuery = query;
        this.first = 0;
        this.rebuildView();
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['features']) {
      this.allRows = rockExplorerFeaturesToListRows(this.features);
      this.rebuildView();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.ui.listPanelOpen()) {
      this.ui.dispatch({ type: 'closeListPanel' });
    }
  }

  onTitleQueryChange(value: string): void {
    this.titleQueryInput = value;
    this.titleQueryUpdate.next(value);
  }

  onFilterChange(): void {
    this.first = 0;
    this.rebuildView();
    this.cdr.markForCheck();
  }

  onSort(field: SortField): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 1 ? -1 : 1;
    } else {
      this.sortField = field;
      this.sortOrder = 1;
    }
    this.updateSortIcons();
    this.rebuildView();
    this.cdr.markForCheck();
  }

  onPage(event: TablePageEvent): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? this.rows;
  }

  clearFilters(): void {
    this.titleQuery = '';
    this.titleQueryInput = '';
    this.potentialFilter = null;
    this.rockQualityFilter = null;
    this.rockTypeFilter = null;
    this.first = 0;
    this.rebuildView();
    this.cdr.markForCheck();
  }

  openFeature(row: RockExplorerListDisplayRow): void {
    this.ui.dispatch({ type: 'openFeatureFromList', featureId: row.id });
  }

  private rebuildView(): void {
    this.hasActiveFilters =
      !!this.titleQuery.trim() ||
      this.potentialFilter != null ||
      this.rockQualityFilter != null ||
      this.rockTypeFilter != null;

    const query = this.titleQuery.trim().toLocaleLowerCase();
    const filtered = this.allRows.filter((row) => {
      if (query) {
        const title = (row.title ?? '').toLocaleLowerCase();
        if (!title.includes(query)) {
          return false;
        }
      }
      if (this.potentialFilter && row.potential !== this.potentialFilter) {
        return false;
      }
      if (
        this.rockQualityFilter &&
        row.rockQuality !== this.rockQualityFilter
      ) {
        return false;
      }
      if (this.rockTypeFilter && row.rockType !== this.rockTypeFilter) {
        return false;
      }
      return true;
    });

    filtered.sort((a, b) =>
      compareRockExplorerListRows(a, b, this.sortField, this.sortOrder),
    );

    const untitled = this.transloco.translate(
      marker('rockExplorer.untitledFeature'),
    );
    const dash = '—';

    this.viewRows = filtered.map((row) => ({
      ...row,
      displayTitle: row.title?.trim() || untitled,
      displayPotential: row.potential
        ? this.transloco.translate(`rockExplorer.potential.${row.potential}`)
        : dash,
      displayRockQuality: row.rockQuality
        ? this.transloco.translate(
            `rockExplorer.rockQuality.${row.rockQuality}`,
          )
        : dash,
      displayRockType: row.rockType
        ? this.transloco.translate(`rockExplorer.rockType.${row.rockType}`)
        : dash,
      displayArea: formatRockExplorerAreaSqM(row.areaSqM) ?? dash,
      potentialColor: this.ui.potentialColor(row.potential),
    }));
  }

  private updateSortIcons(): void {
    const idle = 'pi pi-sort-alt';
    const up = 'pi pi-sort-amount-up-alt';
    const down = 'pi pi-sort-amount-down';
    const active = this.sortOrder === 1 ? up : down;
    for (const field of Object.keys(this.sortIcons) as SortField[]) {
      this.sortIcons[field] = field === this.sortField ? active : idle;
    }
  }
}
