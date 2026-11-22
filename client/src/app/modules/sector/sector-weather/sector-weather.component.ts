import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CondicasterComponent } from '../../weather/condicaster/condicaster.component';

@Component({
  selector: 'lc-sector-weather',
  imports: [CondicasterComponent],
  templateUrl: './sector-weather.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sector-weather.component.scss',
})
export class SectorWeatherComponent implements OnInit {
  public sectorSlug: string;
  public weatherLink: string[] = [];

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.sectorSlug = params.get('sector-slug');
        const cragSlug = this.param('crag-slug');
        this.weatherLink = ['/topo', cragSlug, this.sectorSlug, 'weather'];
      });
  }

  private param(name: string): string {
    let route: ActivatedRoute | null = this.route;
    while (route) {
      const value = route.snapshot.paramMap.get(name);
      if (value) {
        return value;
      }
      route = route.parent;
    }
    return null;
  }
}
