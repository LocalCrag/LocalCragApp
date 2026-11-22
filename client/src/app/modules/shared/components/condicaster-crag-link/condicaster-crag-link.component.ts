import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { Coordinates } from '../../../../interfaces/coordinates.interface';
import { CondicasterCragHit } from '../../../../services/crud/condicaster.service';
import { CondicasterCragSearchComponent } from '../condicaster-crag-search/condicaster-crag-search.component';

export type CondicasterCragLink = {
  cragId: number;
  name: string | null;
};

@Component({
  selector: 'lc-condicaster-crag-link',
  templateUrl: './condicaster-crag-link.component.html',
  styleUrl: './condicaster-crag-link.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslocoDirective, HlmButton],
})
export class CondicasterCragLinkComponent {
  public readonly cragId = input<number | null>(null);
  public readonly cragName = input<string | null>(null);
  public readonly coordinates = input<Coordinates | null>(null);
  public readonly linkChange = output<CondicasterCragLink | null>();

  private dialogs = inject(HlmDialogService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  protected openSearch(): void {
    const ref = this.dialogs.open(CondicasterCragSearchComponent, {
      title: this.transloco.translate(marker('condicaster.search.title')),
      contentClass: 'max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg',
      context: { coordinates: this.coordinates() },
    });
    ref.closed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const hit = result as CondicasterCragHit | undefined;
        if (!hit?.cragId) {
          return;
        }
        this.linkChange.emit({ cragId: hit.cragId, name: hit.name || null });
      });
  }

  protected clear(): void {
    this.linkChange.emit(null);
  }
}
