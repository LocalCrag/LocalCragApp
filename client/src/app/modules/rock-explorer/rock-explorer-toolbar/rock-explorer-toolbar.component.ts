import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { Slider } from 'primeng/slider';
import { Checkbox } from 'primeng/checkbox';
import { Tooltip } from 'primeng/tooltip';
import { DialogService } from 'primeng/dynamicdialog';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { TranslocoDirective } from '@jsverse/transloco';
import { RockExplorerUiService } from '../rock-explorer-ui.service';
import { RockExplorerLocationSearchDialogComponent } from '../rock-explorer-location-search-dialog/rock-explorer-location-search-dialog.component';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { User } from '../../../models/user';

@Component({
  selector: 'lc-rock-explorer-toolbar',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    Button,
    Select,
    Popover,
    Slider,
    Checkbox,
    Tooltip,
    AutoCompleteModule,
    TranslocoDirective,
  ],
  providers: [DialogService],
  templateUrl: './rock-explorer-toolbar.component.html',
  styleUrl: './rock-explorer-toolbar.component.scss',
})
export class RockExplorerToolbarComponent implements OnInit {
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
  private dialogService = inject(DialogService);
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

  public searchCreatedBy(event: AutoCompleteCompleteEvent): void {
    const query = event.query?.trim();
    if (!query) {
      this.createdBySuggestions = [];
      return;
    }
    this.rockExplorerService.searchCreators(query).subscribe((users) => {
      this.createdBySuggestions = users;
    });
  }

  public openLocationSearch(): void {
    this.dialogService.open(RockExplorerLocationSearchDialogComponent, {
      position: 'top',
      closeOnEscape: true,
      dismissableMask: true,
      modal: true,
      showHeader: false,
      styleClass: 'search-dialog',
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
