import { enableProdMode, provideZoneChangeDetection } from '@angular/core';

import { environment } from './environments/environment';

import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/modules/core/app.config';
import { CoreComponent } from './app/modules/core/core.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(CoreComponent, {
  ...appConfig,
  providers: [provideZoneChangeDetection(), ...appConfig.providers],
}).catch((err) => console.error(err));

Chart.register(ChartDataLabels);
