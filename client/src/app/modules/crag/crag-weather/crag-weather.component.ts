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
  selector: 'lc-crag-weather',
  imports: [CondicasterComponent],
  templateUrl: './crag-weather.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './crag-weather.component.scss',
})
export class CragWeatherComponent implements OnInit {
  public cragSlug: string;
  public weatherLink: string[] = [];

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.cragSlug = params.get('crag-slug');
        this.weatherLink = ['/topo', this.cragSlug, 'weather'];
      });
  }
}
