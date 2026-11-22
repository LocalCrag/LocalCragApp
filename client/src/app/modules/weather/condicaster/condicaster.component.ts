import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import {
  CondicasterConditions,
  CondicasterDay,
  CondicasterHour,
  CondicasterService,
} from '../../../services/crud/condicaster.service';
import { CONDI_BAND_COLOR, condiScoreBand } from '../../../utility/condi-score';
import { CondicasterDayCardsComponent } from './condicaster-day-cards.component';
import { CondicasterHourlyChartsComponent } from './condicaster-hourly-charts.component';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-condicaster',
  templateUrl: './condicaster.component.html',
  styleUrl: './condicaster.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoDirective,
    CondicasterDayCardsComponent,
    CondicasterHourlyChartsComponent,
    HlmSkeleton,
  ],
})
export class CondicasterComponent implements OnInit {
  @Input() level: 'crag' | 'sector' | 'area';
  @Input() slug: string;
  @Input() weatherLink: string[] = [];

  public conditions: CondicasterConditions | null = null;
  public enabled = false;
  public loading = false;
  public selectedDate: string | null = null;
  /** Stable lists. A fresh array on every check rebuilds the charts and resets the day scroller. */
  protected dayChoices: CondicasterDay[] = [];
  protected visibleHours: CondicasterHour[] = [];

  private condicasterService = inject(CondicasterService);
  private destroyRef = inject(DestroyRef);
  private changeDetector = inject(ChangeDetectorRef);
  private transloco = inject(TranslocoService);
  private store = inject(Store);

  ngOnInit(): void {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(
        filter((settings) => settings.loaded),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((settings) => {
        if (!settings.condicasterEnabled) {
          this.changeDetector.markForCheck();
          return;
        }
        this.enabled = true;
        this.loading = true;
        this.changeDetector.markForCheck();
        this.condicasterService
          .getConditions(this.level, this.slug)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (conditions) => {
              this.conditions = conditions;
              this.loading = false;
              this.refreshDayChoices();
              this.refreshVisibleHours();
              this.changeDetector.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.changeDetector.markForCheck();
            },
          });
      });
  }

  protected attributionHref(): string {
    const cragId = this.conditions?.condicasterCragId;
    if (!cragId) {
      return 'https://condicaster.wtf';
    }
    return `https://condicaster.wtf/crag-${cragId}`;
  }

  protected timeZone(): string {
    return this.conditions?.timezone || 'UTC';
  }

  protected selectDay(localDate: string): void {
    this.selectedDate = localDate;
    this.refreshVisibleHours();
  }

  private refreshDayChoices(): void {
    const byDate = new Map<string, CondicasterDay>();
    for (const day of this.conditions?.daily ?? []) {
      if (day.local_date) {
        byDate.set(day.local_date, day);
      }
    }
    for (const hour of this.conditions?.hourly ?? []) {
      if (!hour.local_date || byDate.has(hour.local_date)) {
        continue;
      }
      byDate.set(hour.local_date, this.dayFromHours(hour.local_date));
    }
    this.dayChoices = [...byDate.values()].sort((left, right) =>
      left.local_date.localeCompare(right.local_date),
    );
  }

  /** A past day can still have hourly rows after its daily summary was missed. */
  private dayFromHours(localDate: string): CondicasterDay {
    const hours = (this.conditions?.hourly ?? []).filter(
      (hour) => hour.local_date === localDate,
    );
    const temps = hours
      .map((hour) => hour.temperature_c)
      .filter((value): value is number => value != null);
    const scores = hours
      .map((hour) => hour.condiscore)
      .filter((value) => value != null);
    return {
      local_date: localDate,
      daytime_condiscore: scores.length
        ? scores.reduce((sum, value) => sum + value, 0) / scores.length
        : null,
      morning_condiscore: null,
      afternoon_condiscore: null,
      evening_condiscore: null,
      temperature_min_c: temps.length ? Math.min(...temps) : null,
      temperature_max_c: temps.length ? Math.max(...temps) : null,
      sunrise_at: null,
      sunset_at: null,
      direct_sun_windows: [],
      explanation: null,
    };
  }

  private refreshVisibleHours(): void {
    const date = this.activeDate();
    this.visibleHours = date
      ? (this.conditions?.hourly ?? []).filter(
          (hour) => hour.local_date === date,
        )
      : [];
  }

  protected activeDate(): string | null {
    if (
      this.selectedDate &&
      this.dayChoices.some((day) => day.local_date === this.selectedDate)
    ) {
      return this.selectedDate;
    }
    const today = this.todayKey();
    if (this.dayChoices.some((day) => day.local_date === today)) {
      return today;
    }
    return this.dayChoices[0]?.local_date ?? null;
  }

  protected formatDay(localDate: string): string {
    const [year, month, day] = localDate.split('-').map(Number);
    if (!year || !month || !day) {
      return localDate;
    }
    return new Intl.DateTimeFormat(this.transloco.getActiveLang(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  /** Today's reading stays on the current hour. Any other day uses that day's forecast. */
  protected headerScore(): number | null {
    if (this.isSelectedToday() && this.conditions?.currentCondiscore != null) {
      return this.conditions.currentCondiscore;
    }
    return (
      this.selectedDay()?.daytime_condiscore ??
      this.conditions?.currentCondiscore ??
      null
    );
  }

  private selectedDay(): CondicasterDay | null {
    const date = this.activeDate();
    if (!date) {
      return null;
    }
    return this.dayChoices.find((day) => day.local_date === date) ?? null;
  }

  private isSelectedToday(): boolean {
    return this.activeDate() === this.todayKey();
  }

  protected bandColor(score: number): string {
    return CONDI_BAND_COLOR[condiScoreBand(score)];
  }

  protected bandKey(score: number): string {
    return `condicaster.band.${condiScoreBand(score)}`;
  }

  private todayKey(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  protected metric(value: number | null, digits = 0, unit = ''): string {
    if (value === null || value === undefined) {
      return '–';
    }
    return `${value.toFixed(digits)}${unit}`;
  }
}
