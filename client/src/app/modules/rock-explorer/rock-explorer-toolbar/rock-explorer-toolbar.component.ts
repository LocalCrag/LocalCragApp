import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { Tooltip } from 'primeng/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { MapStyles } from '../../../enums/map-styles';
import { RockExplorerUiService } from '../rock-explorer-ui.service';

@Component({
  selector: 'lc-rock-explorer-toolbar',
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    Popover,
    Tooltip,
    TranslocoDirective,
  ],
  templateUrl: './rock-explorer-toolbar.component.html',
  styleUrl: './rock-explorer-toolbar.component.scss',
})
export class RockExplorerToolbarComponent implements OnInit {
  readonly ui = inject(RockExplorerUiService);
  readonly MapStyles = MapStyles;

  public filterForm = inject(FormBuilder).group({
    potential: [null as string | null],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
  });

  private destroyRef = inject(DestroyRef);

  public get activeFilterCount(): number {
    const value = this.filterForm.getRawValue();
    return [value.potential, value.rockQuality, value.rockType].filter(
      (v) => v != null && v !== '',
    ).length;
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
          },
        });
      });
  }

  public clearFilters(): void {
    this.filterForm.reset({
      potential: null,
      rockQuality: null,
      rockType: null,
    });
  }
}
