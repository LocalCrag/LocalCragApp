import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlocweatherComponent } from '../../weather/blocweather/blocweather.component';

@Component({
  selector: 'lc-crag-weather',
  imports: [BlocweatherComponent],
  templateUrl: './crag-weather.component.html',
  styleUrl: './crag-weather.component.scss',
})
export class CragWeatherComponent implements OnInit {
  public cragSlug: string;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.cragSlug = params.get('crag-slug');
      });
  }
}
