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
  selector: 'lc-area-weather',
  imports: [CondicasterComponent],
  templateUrl: './area-weather.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './area-weather.component.scss',
})
export class AreaWeatherComponent implements OnInit {
  public areaSlug: string;
  public weatherLink: string[] = [];

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.areaSlug = params.get('area-slug');
        this.weatherLink = [
          '/topo',
          this.param('crag-slug'),
          this.param('sector-slug'),
          this.areaSlug,
          'weather',
        ];
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
