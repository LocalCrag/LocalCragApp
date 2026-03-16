import {
  Component,
  inject,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  BlocWeatherClassification,
  BlocWeatherConfig,
  BlocWeatherService,
} from '../../../services/crud/blocweather.service';
import { switchMap, EMPTY } from 'rxjs';
import { Message } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';
import { ReportConditionsDialogComponent } from '../report-conditions-dialog/report-conditions-dialog.component';
import { Button } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'lc-current-conditions',
  imports: [
    Message,
    TranslocoDirective,
    ReportConditionsDialogComponent,
    Button,
    RouterLink,
  ],
  templateUrl: './current-conditions.component.html',
  styleUrl: './current-conditions.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CurrentConditionsComponent implements OnInit {
  @Input() level: string;
  @Input() slug: string;
  @Input() disableDetailsLink = false;
  private blocWeatherService = inject(BlocWeatherService);
  private router = inject(Router);

  get weatherLink(): string {
    return this.router.url.split('?')[0] + '/weather';
  }

  public classification: BlocWeatherClassification;
  /** t(blocWeather.very_probably) **/
  /** t(blocWeather.probably) **/
  /** t(blocWeather.eventually) **/
  public certaintyVerb: 'very_probably' | 'probably' | 'eventually';
  public blocWeatherConfig: BlocWeatherConfig;

  ngOnInit() {
    this.blocWeatherService
      .getNearest(this.level, this.slug)
      .pipe(
        switchMap((config) => {
          if (!config) return EMPTY;
          this.blocWeatherConfig = config;
          return this.blocWeatherService.getClassification(config);
        }),
      )
      .subscribe((classification) => {
        this.classification = classification;
        const uncertainty =
          classification.max_saturation - this.classification.min_saturation;
        if (uncertainty < 0.05) {
          this.certaintyVerb = null;
        } else if (uncertainty < 0.1) {
          this.certaintyVerb = 'very_probably';
        } else if (uncertainty < 0.3) {
          this.certaintyVerb = 'probably';
        } else {
          this.certaintyVerb = 'eventually';
        }
      });
  }
}
