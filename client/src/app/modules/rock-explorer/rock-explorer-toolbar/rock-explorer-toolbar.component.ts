import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { RockExplorerUiService } from '../rock-explorer-ui.service';
import { RockExplorerLocationSearchDialogComponent } from '../rock-explorer-location-search-dialog/rock-explorer-location-search-dialog.component';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { User } from '../../../models/user';
import { OverlayPositionBuilder } from '@angular/cdk/overlay';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmSliderImports } from '@spartan-ng/helm/slider';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideCheck,
  lucideChevronDown,
  lucideChevronRight,
  lucideEllipsisVertical,
  lucideFunnel,
  lucideImage,
  lucideList,
  lucideMapPin,
  lucidePause,
  lucidePencil,
  lucidePlay,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideSlidersHorizontal,
  lucideSquare,
  lucideTable,
  lucideTrash2,
  lucideUndo2,
  lucideUpload,
  lucideX,
} from '@ng-icons/lucide';

import { HlmInput } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'lc-rock-explorer-toolbar',
  imports: [
    LoadingButtonComponent,
    HlmInput,
    ...HlmPopoverImports,
    ...HlmPopoverImports,
    ReactiveFormsModule,
    FormsModule,
    TranslocoDirective,
    HlmButton,
    ...HlmSelectImports,
    HlmCheckbox,
    HlmTooltip,
    ...HlmSliderImports,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideArrowDown,
      lucideArrowUp,
      lucideCheck,
      lucideChevronDown,
      lucideChevronRight,
      lucideEllipsisVertical,
      lucideFunnel,
      lucideImage,
      lucideList,
      lucideMapPin,
      lucidePause,
      lucidePencil,
      lucidePlay,
      lucidePlus,
      lucideRefreshCw,
      lucideSearch,
      lucideSlidersHorizontal,
      lucideSquare,
      lucideTable,
      lucideTrash2,
      lucideUndo2,
      lucideUpload,
      lucideX,
    }),
  ],
  templateUrl: './rock-explorer-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './rock-explorer-toolbar.component.scss',
})
export class RockExplorerToolbarComponent implements OnInit, AfterViewInit {
  readonly ui = inject(RockExplorerUiService);
  /** Overlay ids with expanded vector source-layer lists. */
  readonly expandedOverlayIds = signal<ReadonlySet<string>>(new Set());

  public filterForm = inject(FormBuilder).group({
    potential: [null as string | null],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
    createdBy: [null as User | null],
  });

  public createdBySuggestions: User[] = [];

  private destroyRef = inject(DestroyRef);
  private dialogService = inject(HlmDialogService);
  private positionBuilder = inject(OverlayPositionBuilder);
  private elementRef = inject(ElementRef<HTMLElement>);
  private rockExplorerService = inject(RockExplorerService);

  public get activeFilterCount(): number {
    const value = this.filterForm.getRawValue();
    return [
      value.potential,
      value.rockQuality,
      value.rockType,
      value.createdBy,
    ].filter((v) => v != null && v !== '').length;
  }

  public get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  ngAfterViewInit(): void {
    const toolbar = this.elementRef.nativeElement.querySelector(
      '.rock-explorer__toolbar',
    ) as HTMLElement | null;
    const mapHost = this.elementRef.nativeElement.parentElement;
    if (!toolbar || !mapHost) {
      return;
    }
    const syncToolbarHeight = () => {
      mapHost.style.setProperty(
        '--rock-explorer-toolbar-height',
        `${toolbar.offsetHeight}px`,
      );
    };
    syncToolbarHeight();
    const observer = new ResizeObserver(syncToolbarHeight);
    observer.observe(toolbar);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const value = this.filterForm.getRawValue();
        this.ui.dispatch({
          type: 'filtersChange',
          filters: {
            potential: value.potential || undefined,
            rockQuality: value.rockQuality || undefined,
            rockType: value.rockType || undefined,
            createdById: value.createdBy?.id || undefined,
          },
        });
      });
  }

  public searchCreatedBy(query: string): void {
    query = query?.trim();
    if (!query) {
      this.createdBySuggestions = [];
      return;
    }
    this.rockExplorerService.searchCreators(query).subscribe((users) => {
      this.createdBySuggestions = users;
    });
  }

  public selectCreatedBy(user: User): void {
    this.filterForm.get('createdBy')?.setValue(user);
    this.createdBySuggestions = [];
  }

  public openLocationSearch(): void {
    this.dialogService.open(RockExplorerLocationSearchDialogComponent, {
      showCloseButton: false,
      contentClass:
        'rock-explorer-location-search w-[min(40rem,calc(100vw-2rem))] max-w-none sm:max-w-[40rem]',
      positionStrategy: this.positionBuilder
        .global()
        .centerHorizontally()
        .top('4.5rem'),
      providers: [{ provide: RockExplorerUiService, useValue: this.ui }],
    });
  }

  public clearFilters(): void {
    this.createdBySuggestions = [];
    this.filterForm.reset({
      potential: null,
      rockQuality: null,
      rockType: null,
      createdBy: null,
    });
  }

  /** Slider UI uses 0–100; MapLibre / settings use 0–1. */
  public opacityPercent(layerId: string): number {
    const value = this.ui.customMapLayerOpacities()[layerId];
    return Math.round((value ?? 0.5) * 100);
  }

  public onOpacityPercentChange(layerId: string, percent: number): void {
    const clamped = Math.min(100, Math.max(0, percent));
    this.ui.dispatch({
      type: 'setCustomMapLayerOpacity',
      layerId,
      opacity: clamped / 100,
    });
  }

  public isLayerVisible(layerId: string): boolean {
    return this.ui.customMapLayerVisibility()[layerId] !== false;
  }

  public onLayerVisibleChange(layerId: string, visible: boolean): void {
    this.ui.dispatch({
      type: 'setCustomMapLayerVisible',
      layerId,
      visible: !!visible,
    });
  }

  public isOverlayExpanded(layerId: string): boolean {
    return this.expandedOverlayIds().has(layerId);
  }

  public toggleOverlayExpanded(layerId: string): void {
    this.expandedOverlayIds.update((current) => {
      const next = new Set(current);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }
}
