import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
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
import { Chart, ChartData, ChartOptions, Plugin } from 'chart.js';
import { combineLatest } from 'rxjs';
import {
  CondicasterDay,
  CondicasterHour,
} from '../../../services/crud/condicaster.service';
import { ThemeService } from '../../../services/core/theme.service';
import { getChartThemeColors } from '../../../utility/chart-theme';
import { CONDI_BAND_COLOR, condiScoreBand } from '../../../utility/condi-score';
import { CONDI_SKY_ICON, CondiSky, condiSky } from '../../../utility/condi-sky';
import { ChartJsDirective } from '../../shared/directives/chart-js.directive';

interface NowLineOptions {
  index: number | null;
  label?: string;
  onLayout?: (left: number, right: number) => void;
}

interface DaylightOptions {
  sunriseAt: number | null;
  sunsetAt: number | null;
  hourTimes: number[];
  dark: boolean;
}

interface DaylightWash {
  night: string;
  nightSoft: string;
  nightClear: string;
  clear: string;
  edge: string;
  base: string;
  warmth: string;
}

const DAYLIGHT_FADE_MS = 60 * 60 * 1000;

function scoreBandColor(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) {
    return CONDI_BAND_COLOR.poor;
  }
  return CONDI_BAND_COLOR[condiScoreBand(score)];
}

/** Horizontal blend: each hour keeps the color of that hour's score. */
function scoreTimeGradient(
  chart: Chart,
  alpha: number,
): CanvasGradient | string {
  const values = (chart.data.datasets[0]?.data ?? []) as (number | null)[];
  const scale = chart.scales['x'];
  const fallback = rgba(scoreBandColor(values[0] ?? null), alpha);
  if (!scale || !chart.chartArea || values.length < 2) {
    return fallback;
  }
  const left = scale.getPixelForValue(0);
  const right = scale.getPixelForValue(values.length - 1);
  if (!Number.isFinite(left) || !Number.isFinite(right) || left === right) {
    return fallback;
  }
  const gradient = chart.ctx.createLinearGradient(left, 0, right, 0);
  const span = right - left;
  let lastOffset = -1;
  values.forEach((value, index) => {
    const offset = Math.min(
      1,
      Math.max(0, (scale.getPixelForValue(index) - left) / span),
    );
    if (offset <= lastOffset) {
      return;
    }
    lastOffset = offset;
    gradient.addColorStop(offset, rgba(scoreBandColor(value), alpha));
  });
  return gradient;
}

function rgba(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function daylightWash(dark: boolean, dimData: boolean): DaylightWash {
  if (dimData) {
    return {
      night: dark ? 'rgba(0, 0, 0, 0.34)' : 'rgba(46, 42, 74, 0.10)',
      nightSoft: dark ? 'rgba(0, 0, 0, 0.16)' : 'rgba(46, 42, 74, 0.05)',
      nightClear: 'rgba(46, 42, 74, 0)',
      clear: 'rgba(255, 196, 87, 0)',
      edge: 'rgba(255, 196, 87, 0)',
      base: 'rgba(255, 196, 87, 0)',
      warmth: 'rgba(217, 162, 76, 0)',
    };
  }
  if (dark) {
    return {
      night: 'rgba(0, 0, 0, 0.42)',
      nightSoft: 'rgba(0, 0, 0, 0.20)',
      nightClear: 'rgba(0, 0, 0, 0)',
      clear: 'rgba(168, 198, 255, 0)',
      edge: 'rgba(168, 198, 255, 0.05)',
      base: 'rgba(168, 198, 255, 0.10)',
      warmth: 'rgba(217, 162, 76, 0.04)',
    };
  }
  return {
    night: 'rgba(46, 42, 74, 0.16)',
    nightSoft: 'rgba(46, 42, 74, 0.07)',
    nightClear: 'rgba(46, 42, 74, 0)',
    clear: 'rgba(255, 196, 87, 0)',
    edge: 'rgba(255, 196, 87, 0.10)',
    base: 'rgba(255, 214, 120, 0.18)',
    warmth: 'rgba(217, 162, 76, 0.05)',
  };
}

function daylightPluginOptions(chart: Chart): DaylightOptions | null {
  return (
    (chart.options.plugins as { condiDaylight?: DaylightOptions } | undefined)
      ?.condiDaylight ?? null
  );
}

function pixelForHourIndex(
  chart: Chart,
  index: number,
  count: number,
): number | null {
  const scale = chart.scales['x'];
  const area = chart.chartArea;
  if (!scale || !area || count < 1) {
    return null;
  }
  const max = count - 1;
  const xAt = (slot: number) =>
    scale.getPixelForValue(Math.max(0, Math.min(max, slot)));
  if (count < 2) {
    return xAt(0);
  }
  return xAt(0) + index * (xAt(1) - xAt(0));
}

function hourIndexAt(times: number[], instant: number): number {
  if (times.length < 2) {
    return 0;
  }
  const step = times[1] - times[0] || 3_600_000;
  if (instant <= times[0]) {
    return (instant - times[0]) / step;
  }
  const last = times.length - 1;
  const lastStep = times[last] - times[last - 1] || step;
  if (instant >= times[last]) {
    return last + (instant - times[last]) / lastStep;
  }
  for (let index = 0; index < last; index += 1) {
    if (instant <= times[index + 1]) {
      const span = times[index + 1] - times[index] || 1;
      return index + (instant - times[index]) / span;
    }
  }
  return last;
}

function drawDaylightWash(chart: Chart, dimData: boolean): void {
  const options = daylightPluginOptions(chart);
  const area = chart.chartArea;
  if (
    !options ||
    options.sunriseAt == null ||
    options.sunsetAt == null ||
    options.sunsetAt <= options.sunriseAt ||
    !area
  ) {
    return;
  }
  const times = options.hourTimes.filter((time) => Number.isFinite(time));
  if (!times.length) {
    return;
  }
  const startX = pixelForHourIndex(
    chart,
    hourIndexAt(times, options.sunriseAt),
    times.length,
  );
  const endX = pixelForHourIndex(
    chart,
    hourIndexAt(times, options.sunsetAt),
    times.length,
  );
  if (startX == null || endX == null || endX - startX <= 1) {
    return;
  }
  const fadeAnchor = pixelForHourIndex(
    chart,
    hourIndexAt(times, options.sunriseAt - DAYLIGHT_FADE_MS),
    times.length,
  );
  const fadeWidth = fadeAnchor == null ? 12 : Math.max(10, startX - fadeAnchor);
  const wash = daylightWash(options.dark, dimData);
  const { ctx } = chart;
  const top = area.top;
  const height = area.bottom - area.top;

  ctx.save();
  ctx.beginPath();
  ctx.rect(area.left, area.top, area.right - area.left, height);
  ctx.clip();

  const fadeStart = Math.max(area.left, startX - fadeWidth);
  if (startX > area.left + 1) {
    if (fadeStart > area.left) {
      ctx.fillStyle = wash.night;
      ctx.fillRect(area.left, top, fadeStart - area.left, height);
    }
    const dawn = ctx.createLinearGradient(fadeStart, 0, startX, 0);
    dawn.addColorStop(0, wash.night);
    dawn.addColorStop(0.55, wash.nightSoft);
    dawn.addColorStop(1, wash.nightClear);
    ctx.fillStyle = dawn;
    ctx.fillRect(fadeStart, top, startX - fadeStart, height);
  }

  const fadeEnd = Math.min(area.right, endX + fadeWidth);
  if (endX < area.right - 1) {
    const dusk = ctx.createLinearGradient(endX, 0, fadeEnd, 0);
    dusk.addColorStop(0, wash.nightClear);
    dusk.addColorStop(0.45, wash.nightSoft);
    dusk.addColorStop(1, wash.night);
    ctx.fillStyle = dusk;
    ctx.fillRect(endX, top, fadeEnd - endX, height);
    if (fadeEnd < area.right) {
      ctx.fillStyle = wash.night;
      ctx.fillRect(fadeEnd, top, area.right - fadeEnd, height);
    }
  }

  const span = endX - startX;
  const fadeStop = Math.max(0.001, Math.min(0.49, fadeWidth / span));
  const daylight = ctx.createLinearGradient(startX, 0, endX, 0);
  daylight.addColorStop(0, wash.clear);
  daylight.addColorStop(fadeStop * 0.45, wash.edge);
  daylight.addColorStop(fadeStop, wash.base);
  daylight.addColorStop(1 - fadeStop, wash.base);
  daylight.addColorStop(1 - fadeStop * 0.45, wash.edge);
  daylight.addColorStop(1, wash.clear);
  ctx.fillStyle = daylight;
  ctx.fillRect(startX, top, span, height);

  const warmth = ctx.createLinearGradient(0, top, 0, area.bottom);
  warmth.addColorStop(0, 'rgba(217, 162, 76, 0)');
  warmth.addColorStop(0.34, wash.warmth);
  warmth.addColorStop(1, 'rgba(217, 162, 76, 0)');
  ctx.fillStyle = warmth;
  ctx.fillRect(startX, top, span, height);
  ctx.restore();
}

const daylightPlugin: Plugin = {
  id: 'condiDaylight',
  beforeDraw(chart) {
    drawDaylightWash(chart, false);
  },
  afterDatasetsDraw(chart) {
    drawDaylightWash(chart, true);
  },
};

const nowLinePlugin: Plugin = {
  id: 'condiNowLine',
  afterLayout(chart) {
    const options = (chart.options.plugins as { condiNowLine?: NowLineOptions })
      ?.condiNowLine;
    if (!options?.onLayout) {
      return;
    }
    const area = chart.chartArea;
    options.onLayout(area.left, chart.width - area.right);
  },
  afterDraw(chart) {
    const options = (chart.options.plugins as { condiNowLine?: NowLineOptions })
      ?.condiNowLine;
    if (options?.index == null || options.index < 0) {
      return;
    }
    const xScale = chart.scales['x'];
    if (!xScale) {
      return;
    }
    const x = xScale.getPixelForValue(options.index);
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;
    const theme = getChartThemeColors();
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.mutedTextColor;
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    if (options.label) {
      ctx.setLineDash([]);
      ctx.fillStyle = theme.textColor;
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(options.label, x, top - 2);
    }
    ctx.restore();
  },
};

interface HoverSyncOptions {
  group: string;
}

const hoverGroups = new Map<string, Set<Chart>>();
const syncedHour = new WeakMap<Chart, number | null>();
let syncingHourHover = false;
let hoverGroupSequence = 0;

function hoverSyncOptions(chart: Chart): HoverSyncOptions | null {
  return (
    (chart.options.plugins as { condiHoverSync?: HoverSyncOptions } | undefined)
      ?.condiHoverSync ?? null
  );
}

function syncHourHover(source: Chart, index: number | null): void {
  const options = hoverSyncOptions(source);
  const peers = options && hoverGroups.get(options.group);
  if (!peers || syncingHourHover) {
    return;
  }
  syncingHourHover = true;
  try {
    for (const chart of peers) {
      if (chart === source || syncedHour.get(chart) === index) {
        continue;
      }
      syncedHour.set(chart, index);
      const active =
        index == null
          ? []
          : chart.data.datasets.map((_, datasetIndex) => ({
              datasetIndex,
              index,
            }));
      chart.setActiveElements(active);
      const x =
        index == null ? 0 : (chart.scales['x']?.getPixelForValue(index) ?? 0);
      const y = chart.chartArea?.top ?? 0;
      chart.tooltip?.setActiveElements(active, { x, y });
      chart.draw();
    }
    syncedHour.set(source, index);
  } finally {
    syncingHourHover = false;
  }
}

const hoverSyncPlugin: Plugin = {
  id: 'condiHoverSync',
  afterInit(chart) {
    const options = hoverSyncOptions(chart);
    if (!options) {
      return;
    }
    const peers = hoverGroups.get(options.group) ?? new Set<Chart>();
    peers.add(chart);
    hoverGroups.set(options.group, peers);
  },
  afterDestroy(chart) {
    const options = hoverSyncOptions(chart);
    const peers = options && hoverGroups.get(options.group);
    peers?.delete(chart);
    if (options && peers?.size === 0) {
      hoverGroups.delete(options.group);
    }
    syncedHour.delete(chart);
  },
  afterEvent(chart, args) {
    if (!hoverSyncOptions(chart) || syncingHourHover) {
      return;
    }
    const event = args.event;
    if (event.type === 'mouseout' || !args.inChartArea || !event.native) {
      syncHourHover(chart, null);
      return;
    }
    const hit = chart.getElementsAtEventForMode(
      event.native,
      'index',
      { intersect: false },
      false,
    )[0];
    syncHourHover(chart, hit?.index ?? null);
  },
};

Chart.register(nowLinePlugin, daylightPlugin, hoverSyncPlugin);

@Component({
  selector: 'lc-condicaster-hourly-charts',
  templateUrl: './condicaster-hourly-charts.component.html',
  styleUrl: './condicaster-hourly-charts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoDirective, ChartJsDirective, NgIcon],
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
export class CondicasterHourlyChartsComponent implements OnChanges {
  @Input() hours: CondicasterHour[] = [];
  @Input() days: CondicasterDay[] = [];
  @Input() timeZone = 'UTC';

  protected plotLeft = 0;
  protected plotRight = 0;

  protected iconLeft(index: number): number {
    const count = this.hours.length;
    if (count <= 1) {
      return 0;
    }
    return (index / (count - 1)) * 100;
  }
  protected scoreData: ChartData | null = null;
  protected scoreOptions: ChartOptions | null = null;
  protected temperatureData: ChartData | null = null;
  protected temperatureOptions: ChartOptions | null = null;
  protected rainData: ChartData | null = null;
  protected rainOptions: ChartOptions | null = null;
  protected humidityData: ChartData | null = null;
  protected humidityOptions: ChartOptions | null = null;
  protected windData: ChartData | null = null;
  protected windOptions: ChartOptions | null = null;
  protected cloudData: ChartData | null = null;
  protected cloudOptions: ChartOptions | null = null;
  protected sunData: ChartData | null = null;
  protected sunOptions: ChartOptions | null = null;

  private readonly hoverGroup = `hourly-${hoverGroupSequence++}`;
  private transloco = inject(TranslocoService);
  private theme = inject(ThemeService);
  private destroyRef = inject(DestroyRef);
  private changeDetector = inject(ChangeDetectorRef);
  private isDarkMode = false;

  constructor() {
    combineLatest([
      toObservable(this.theme.isDarkMode),
      this.transloco.langChanges$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isDarkMode]) => {
        this.isDarkMode = isDarkMode;
        this.build();
        this.changeDetector.markForCheck();
      });
  }

  ngOnChanges(): void {
    this.build();
  }

  protected skyOf(hour: CondicasterHour): CondiSky {
    return condiSky(
      hour,
      this.days.find((day) => day.local_date === hour.local_date),
    );
  }

  protected skyIcon(hour: CondicasterHour): string {
    return CONDI_SKY_ICON[this.skyOf(hour)];
  }

  protected skyLabel(hour: CondicasterHour): string {
    return this.transloco.translate(`condicaster.sky.${this.skyOf(hour)}`);
  }

  protected hourLabel(hour: CondicasterHour): string {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: this.timeZone,
    }).format(new Date(hour.valid_at));
  }

  private build(): void {
    const hours = this.hours ?? [];
    if (!hours.length) {
      this.scoreData = null;
      this.temperatureData = null;
      this.rainData = null;
      this.humidityData = null;
      this.windData = null;
      this.cloudData = null;
      this.sunData = null;
      return;
    }
    const labels = hours.map((hour) => this.hourLabel(hour));
    const theme = getChartThemeColors();
    const nowIndex = this.nowIndex(hours);
    const daylight = this.daylight(hours);
    this.buildScore(
      hours,
      labels,
      theme.textColor,
      theme.gridColor,
      nowIndex,
      daylight,
    );
    this.buildTemperature(
      hours,
      labels,
      theme.textColor,
      theme.gridColor,
      nowIndex,
      daylight,
    );
    this.buildRain(
      hours,
      labels,
      theme.textColor,
      theme.gridColor,
      nowIndex,
      daylight,
    );
    const percent = { min: 0, max: 100, step: 25 };
    const humidity = this.metricChart(
      hours,
      labels,
      theme.textColor,
      theme.gridColor,
      nowIndex,
      daylight,
      marker('condicaster.humidity'),
      hours.map((hour) => hour.humidity_pct),
      this.isDarkMode ? '#5eead4' : '#0f766e',
      percent,
      (value) => `${Math.round(value)}%`,
    );
    this.humidityData = humidity?.data ?? null;
    this.humidityOptions = humidity?.options ?? null;
    const wind = this.metricChart(
      hours,
      labels,
      theme.textColor,
      theme.gridColor,
      nowIndex,
      daylight,
      marker('condicaster.wind'),
      hours.map((hour) => hour.wind_speed_kmh),
      this.isDarkMode ? '#86efac' : '#15803d',
      { min: 0 },
      (value) => `${value.toFixed(1)} km/h`,
    );
    this.windData = wind?.data ?? null;
    this.windOptions = wind?.options ?? null;
    const clouds = this.metricChart(
      hours,
      labels,
      theme.textColor,
      theme.gridColor,
      nowIndex,
      daylight,
      marker('condicaster.clouds'),
      hours.map((hour) => hour.cloud_cover_pct),
      this.isDarkMode ? '#cbd5e1' : '#64748b',
      percent,
      (value) => `${Math.round(value)}%`,
    );
    this.cloudData = clouds?.data ?? null;
    this.cloudOptions = clouds?.options ?? null;
    const sun = this.metricChart(
      hours,
      labels,
      theme.textColor,
      theme.gridColor,
      nowIndex,
      daylight,
      marker('condicaster.sun'),
      hours.map((hour) => hour.solar_radiation_pct),
      this.isDarkMode ? '#facc15' : '#ca8a04',
      percent,
      (value) => `${Math.round(value)}%`,
    );
    this.sunData = sun?.data ?? null;
    this.sunOptions = sun?.options ?? null;
  }

  private buildScore(
    hours: CondicasterHour[],
    labels: string[],
    textColor: string,
    gridColor: string,
    nowIndex: number | null,
    daylight: DaylightOptions,
  ): void {
    this.scoreData = {
      labels,
      datasets: [
        {
          label: this.transloco.translate(marker('condicaster.scoreLabel')),
          data: hours.map((hour) => hour.condiscore),
          borderColor: (context) => scoreTimeGradient(context.chart, 1),
          backgroundColor: (context) => scoreTimeGradient(context.chart, 0.28),
          pointBackgroundColor: (context) => scoreBandColor(context.parsed?.y),
          pointBorderColor: (context) => scoreBandColor(context.parsed?.y),
          pointHoverBackgroundColor: (context) =>
            scoreBandColor(context.parsed?.y),
          pointHoverBorderColor: '#ffffff',
          fill: 'origin',
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
    this.scoreOptions = this.options(
      textColor,
      gridColor,
      nowIndex,
      hours,
      { min: 0, max: 5, step: 1 },
      (hour, value) => {
        const band = this.transloco.translate(
          `condicaster.band.${condiScoreBand(value)}`,
        );
        return `${value.toFixed(1)} · ${band} · ${this.skyLabel(hour)}`;
      },
      nowIndex != null,
      daylight,
    );
  }

  private buildTemperature(
    hours: CondicasterHour[],
    labels: string[],
    textColor: string,
    gridColor: string,
    nowIndex: number | null,
    daylight: DaylightOptions,
  ): void {
    const values = hours.map((hour) => hour.temperature_c);
    if (values.every((value) => value == null)) {
      this.temperatureData = null;
      return;
    }
    const color = this.isDarkMode ? '#93c5fd' : '#1d4ed8';
    this.temperatureData = {
      labels,
      datasets: [
        {
          label: this.transloco.translate(marker('condicaster.temperature')),
          data: values,
          borderColor: color,
          backgroundColor: this.fade(color, 0.16),
          fill: 'origin',
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
    this.temperatureOptions = this.options(
      textColor,
      gridColor,
      nowIndex,
      hours,
      undefined,
      (_hour, value) => `${value.toFixed(1)}°`,
      false,
      daylight,
    );
  }

  private buildRain(
    hours: CondicasterHour[],
    labels: string[],
    textColor: string,
    gridColor: string,
    nowIndex: number | null,
    daylight: DaylightOptions,
  ): void {
    const values = hours.map((hour) => hour.rain_mm);
    if (values.every((value) => value == null)) {
      this.rainData = null;
      return;
    }
    const color = this.isDarkMode ? '#7dd3fc' : '#0369a1';
    this.rainData = {
      labels,
      datasets: [
        {
          label: this.transloco.translate(marker('condicaster.rain')),
          data: values,
          backgroundColor: this.fade(color, 0.8),
          borderColor: color,
          borderWidth: 1,
          clip: false,
        },
      ],
    };
    this.rainOptions = this.options(
      textColor,
      gridColor,
      nowIndex,
      hours,
      { min: 0 },
      (hour, value) => {
        const probability =
          hour.rain_probability_pct == null
            ? ''
            : ` · ${Math.round(hour.rain_probability_pct)}%`;
        return `${value.toFixed(1)} mm${probability}`;
      },
      false,
      daylight,
    );
  }

  private metricChart(
    hours: CondicasterHour[],
    labels: string[],
    textColor: string,
    gridColor: string,
    nowIndex: number | null,
    daylight: DaylightOptions,
    labelKey: string,
    values: (number | null)[],
    color: string,
    y: { min?: number; max?: number; step?: number },
    format: (value: number) => string,
  ): { data: ChartData; options: ChartOptions } | null {
    if (values.every((value) => value == null)) {
      return null;
    }
    return {
      data: {
        labels,
        datasets: [
          {
            label: this.transloco.translate(labelKey),
            data: values,
            borderColor: color,
            backgroundColor: this.fade(color, 0.16),
            fill: 'origin',
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: this.options(
        textColor,
        gridColor,
        nowIndex,
        hours,
        y,
        (_hour, value) => format(value),
        false,
        daylight,
      ),
    };
  }

  private options(
    textColor: string,
    gridColor: string,
    nowIndex: number | null,
    hours: CondicasterHour[],
    y: { min?: number; max?: number; step?: number } | undefined,
    labelFor: (hour: CondicasterHour, value: number) => string,
    drawNowLabel = false,
    daylight?: DaylightOptions,
  ): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      // Chart.js animates line points up from the baseline and only commits
      // them on animation frames. Draw the final line immediately.
      animation: false,
      layout: { padding: { top: drawNowLabel ? 16 : 0 } },
      interaction: { mode: 'index', intersect: false },
      hover: { mode: 'index', intersect: false },
      scales: {
        x: {
          // Hours sit on the plot edges. Centering them leaves an empty slot
          // before the first hour and after the last.
          offset: false,
          ticks: {
            color: textColor,
            autoSkip: true,
            maxTicksLimit: 12,
            maxRotation: 0,
          },
          grid: { display: false },
        },
        y: {
          min: y?.min,
          max: y?.max,
          afterFit: (scale) => {
            scale.width = 40;
          },
          ticks: { color: textColor, stepSize: y?.step },
          grid: { color: gridColor },
        },
      },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
        tooltip: {
          animation: { duration: 0 },
          xAlign: 'center',
          yAlign: 'bottom',
          callbacks: {
            label: (item) => {
              const hour = hours[item.dataIndex];
              const value = item.parsed.y;
              if (!hour || value == null) {
                return '';
              }
              return labelFor(hour, value);
            },
          },
        },
        condiNowLine: {
          index: nowIndex,
          label: drawNowLabel
            ? this.transloco.translate(marker('condicaster.now'))
            : undefined,
          onLayout: drawNowLabel
            ? (left, right) => this.rememberPlotInsets(left, right)
            : undefined,
        },
        condiDaylight: daylight,
        condiHoverSync: { group: this.hoverGroup },
      } as ChartOptions['plugins'],
    };
  }

  private rememberPlotInsets(left: number, right: number): void {
    const nextLeft = Math.round(left);
    const nextRight = Math.round(right);
    if (nextLeft === this.plotLeft && nextRight === this.plotRight) {
      return;
    }
    queueMicrotask(() => {
      this.plotLeft = nextLeft;
      this.plotRight = nextRight;
      this.changeDetector.detectChanges();
    });
  }

  private daylight(hours: CondicasterHour[]): DaylightOptions {
    const day = (this.days ?? []).find(
      (entry) => entry.local_date === hours[0]?.local_date,
    );
    const sunriseAt = day?.sunrise_at ? Date.parse(day.sunrise_at) : NaN;
    const sunsetAt = day?.sunset_at ? Date.parse(day.sunset_at) : NaN;
    return {
      sunriseAt: Number.isFinite(sunriseAt) ? sunriseAt : null,
      sunsetAt: Number.isFinite(sunsetAt) ? sunsetAt : null,
      hourTimes: hours.map((hour) => Date.parse(hour.valid_at)),
      dark: this.isDarkMode,
    };
  }

  private nowIndex(hours: CondicasterHour[]): number | null {
    if (hours[0]?.local_date !== this.todayKey()) {
      return null;
    }
    const now = Date.now();
    let index: number | null = null;
    hours.forEach((hour, position) => {
      const at = Date.parse(hour.valid_at);
      if (Number.isFinite(at) && at <= now) {
        index = position;
      }
    });
    return index;
  }

  private todayKey(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private fade(color: string, alpha: number): string {
    const channel = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return color.startsWith('#') && color.length === 7
      ? `${color}${channel}`
      : color;
  }
}
