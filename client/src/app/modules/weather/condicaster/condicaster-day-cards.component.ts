import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCloud,
  lucideCloudMoon,
  lucideCloudRain,
  lucideCloudSnow,
  lucideCloudSun,
  lucideMoon,
  lucideSun,
} from '@ng-icons/lucide';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import {
  CondicasterDay,
  CondicasterHour,
} from '../../../services/crud/condicaster.service';
import { CONDI_BAND_COLOR, condiScoreBand } from '../../../utility/condi-score';
import {
  CONDI_SKY_ICON,
  CondiSky,
  condiDaySky,
} from '../../../utility/condi-sky';

@Component({
  selector: 'lc-condicaster-day-cards',
  templateUrl: './condicaster-day-cards.component.html',
  styleUrl: './condicaster-day-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoDirective, NgIcon],
  providers: [
    provideIcons({
      lucideSun,
      lucideCloudSun,
      lucideCloud,
      lucideCloudRain,
      lucideCloudSnow,
      lucideMoon,
      lucideCloudMoon,
    }),
  ],
})
export class CondicasterDayCardsComponent
  implements OnChanges, AfterViewChecked
{
  @Input() days: CondicasterDay[] = [];
  @Input() hours: CondicasterHour[] = [];
  @Input() timeZone = 'UTC';
  @Input() selectedDate: string | null = null;
  @Output() daySelected = new EventEmitter<string>();

  @ViewChild('dayStrip') private dayStrip?: ElementRef<HTMLElement>;

  private transloco = inject(TranslocoService);
  /** Past days sit to the left. The strip opens on today until the user scrolls. */
  private pinnedToday = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['days'] || changes['days'].firstChange) {
      return;
    }
    const previous = this.dateKey(changes['days'].previousValue);
    const next = this.dateKey(changes['days'].currentValue);
    if (previous !== next) {
      this.pinnedToday = false;
    }
  }

  ngAfterViewChecked(): void {
    this.pinToday();
  }

  private pinToday(): void {
    if (this.pinnedToday) {
      return;
    }
    const strip = this.dayStrip?.nativeElement;
    if (!strip) {
      return;
    }
    const today = strip.querySelector<HTMLElement>('[data-today]');
    if (!today) {
      if (this.days.length > 0) {
        this.pinnedToday = true;
      }
      return;
    }
    if (strip.clientWidth === 0 || today.getBoundingClientRect().width === 0) {
      return;
    }
    const delta =
      today.getBoundingClientRect().left - strip.getBoundingClientRect().left;
    if (Math.abs(delta) > 1) {
      const rtl = getComputedStyle(strip).direction === 'rtl';
      strip.scrollLeft += rtl ? -delta : delta;
    }
    this.pinnedToday = true;
  }

  private dateKey(days: CondicasterDay[] | null | undefined): string {
    return (days ?? []).map((day) => day.local_date).join('|');
  }

  protected isSelected(day: CondicasterDay): boolean {
    return day.local_date === this.selectedDate;
  }

  protected select(day: CondicasterDay): void {
    this.daySelected.emit(day.local_date);
  }

  protected isToday(day: CondicasterDay): boolean {
    return day.local_date === this.todayKey();
  }

  protected dayName(day: CondicasterDay): string {
    if (this.isToday(day)) {
      return this.transloco.translate(marker('condicaster.today'));
    }
    return this.format(day.local_date, { weekday: 'short' });
  }

  protected dayDate(day: CondicasterDay): string {
    return this.format(day.local_date, { day: 'numeric', month: 'short' });
  }

  protected sky(day: CondicasterDay): CondiSky {
    const hours = (this.hours ?? []).filter(
      (hour) => hour.local_date === day.local_date,
    );
    return condiDaySky(day, hours);
  }

  protected skyIcon(day: CondicasterDay): string {
    return CONDI_SKY_ICON[this.sky(day)];
  }

  protected skyLabel(day: CondicasterDay): string {
    return this.transloco.translate(`condicaster.sky.${this.sky(day)}`);
  }

  protected scoreColor(day: CondicasterDay): string | null {
    if (day.daytime_condiscore == null) {
      return null;
    }
    return CONDI_BAND_COLOR[condiScoreBand(day.daytime_condiscore)];
  }

  protected score(day: CondicasterDay): string {
    return day.daytime_condiscore == null
      ? '–'
      : day.daytime_condiscore.toFixed(1);
  }

  protected bandLabel(day: CondicasterDay): string {
    if (day.daytime_condiscore == null) {
      return '';
    }
    return this.transloco.translate(
      `condicaster.band.${condiScoreBand(day.daytime_condiscore)}`,
    );
  }

  protected temperatures(day: CondicasterDay): string {
    const max = this.degrees(day.temperature_max_c);
    const min = this.degrees(day.temperature_min_c);
    if (max == null && min == null) {
      return '–';
    }
    if (max == null) {
      return min;
    }
    if (min == null) {
      return max;
    }
    return `${max} | ${min}`;
  }

  private degrees(value: number | null): string | null {
    if (value == null) {
      return null;
    }
    return `${Math.round(value)}°`;
  }

  private todayKey(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private format(
    localDate: string,
    options: Intl.DateTimeFormatOptions,
  ): string {
    const [year, month, day] = localDate.split('-').map(Number);
    if (!year || !month || !day) {
      return localDate;
    }
    return new Intl.DateTimeFormat(this.transloco.getActiveLang(), {
      ...options,
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }
}
