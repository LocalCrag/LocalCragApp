import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlocweatherComponent } from '../../weather/blocweather/blocweather.component';

@Component({
  selector: 'lc-area-weather',
  imports: [BlocweatherComponent],
  templateUrl: './area-weather.component.html',
  styleUrl: './area-weather.component.scss',
})
export class AreaWeatherComponent implements OnInit {
  public areaSlug: string;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.areaSlug = params.get('area-slug');
      });
  }
}
