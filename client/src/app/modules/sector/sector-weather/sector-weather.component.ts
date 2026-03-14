import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlocweatherComponent } from '../../weather/blocweather/blocweather.component';

@Component({
  selector: 'lc-sector-weather',
  imports: [BlocweatherComponent],
  templateUrl: './sector-weather.component.html',
  styleUrl: './sector-weather.component.scss',
})
export class SectorWeatherComponent implements OnInit {
  public sectorSlug: string;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.sectorSlug = params.get('sector-slug');
      });
  }
}
