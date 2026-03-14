import { Component, inject, Input, OnInit } from '@angular/core';
import {
  BlocWeatherConfig,
  BlocWeatherService,
} from '../../../services/crud/blocweather.service';
import { Skeleton } from 'primeng/skeleton';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Message } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'lc-blocweather',
  imports: [Skeleton, Message, TranslocoDirective],
  templateUrl: './blocweather.component.html',
  styleUrl: './blocweather.component.scss',
})
export class BlocweatherComponent implements OnInit {
  @Input() level: string;
  @Input() slug: string;
  private blocWeatherService = inject(BlocWeatherService);
  private sanitizer = inject(DomSanitizer);

  public blocWeatherConfig: BlocWeatherConfig;
  public safeBlocWeatherUrl: SafeResourceUrl | null = null;

  ngOnInit() {
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
}
