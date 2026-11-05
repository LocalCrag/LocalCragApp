import { OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Line } from '../../../models/line';
import { ScalesService } from '../../../services/crud/scales.service';
import { topoLinePaint$ } from '../../../utility/scale/topo-line-color';

/**
 * Line color shown on topo images and their number badges.
 * Follows the instance scale-color toggle.
 */
@Pipe({
  name: 'topoLineColor',
  pure: false,
})
export class TopoLineColorPipe implements PipeTransform, OnDestroy {
  private scales = inject(ScalesService);
  private store = inject(Store);

  private subscription: Subscription | null = null;
  private cached: string | undefined;
  private loaded = false;
  private lastLine: Line | undefined;

  transform(line?: Line): string | undefined {
    if (line !== this.lastLine) {
      this.lastLine = line;
      this.loaded = false;
      this.cached = undefined;
      this.subscription?.unsubscribe();
      this.subscription = topoLinePaint$(this.store, this.scales, line)
        .pipe(map((paint) => paint.scaleColor ?? line?.color))
        .subscribe((color) => {
          this.cached = color;
          this.loaded = true;
        });
    }
    return this.loaded ? this.cached : line?.color;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
