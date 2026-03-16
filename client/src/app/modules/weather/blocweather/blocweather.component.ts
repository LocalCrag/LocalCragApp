import {
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  BlocWeatherConfig,
  BlocWeatherService,
} from '../../../services/crud/blocweather.service';
import { Skeleton } from 'primeng/skeleton';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Message } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';
import { CurrentConditionsComponent } from '../current-conditions/current-conditions.component';

@Component({
  selector: 'lc-blocweather',
  imports: [Skeleton, Message, TranslocoDirective, CurrentConditionsComponent],
  templateUrl: './blocweather.component.html',
  styleUrl: './blocweather.component.scss',
})
export class BlocweatherComponent implements OnInit, OnDestroy {
  @Input() level: string;
  @Input() slug: string;
  private blocWeatherService = inject(BlocWeatherService);
  private sanitizer = inject(DomSanitizer);
  private el = inject(ElementRef);

  public blocWeatherConfig: BlocWeatherConfig;
  public safeBlocWeatherUrl: SafeResourceUrl | null = null;
  public iframeHeight = 420;

  private resizeObserver: ResizeObserver;

  ngOnInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      this.iframeHeight = this.calcHeight(width);
    });
    this.resizeObserver.observe(this.el.nativeElement);

    this.blocWeatherService
      .getNearest(this.level, this.slug)
      .subscribe((config) => {
        this.blocWeatherConfig = config;
        if (this.blocWeatherConfig) {
          const url = `https://blocweather.com/embed/${this.blocWeatherConfig.country}/${this.blocWeatherConfig.region}/${this.blocWeatherConfig.spot}/chart`;
          this.safeBlocWeatherUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(url);
        } else {
          this.safeBlocWeatherUrl = null;
        }
      });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  /**
   * Dynamic iframe height adjustment based on container width.
   * Doesn't work really reliable.
   * Will be hopefully made unnecessary by a blocweather update.
   */
  private calcHeight(width: number): number {
    if (width < 480) return 560;
    if (width <= 770) return 480;
    return 466;
  }
}
