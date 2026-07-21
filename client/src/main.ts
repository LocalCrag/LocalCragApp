import { enableProdMode, provideZoneChangeDetection } from '@angular/core';

import { environment } from './environments/environment';

import Quill from 'quill';
import ImageUploader from 'quill-image-uploader';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import BlotFormatter from 'quill-blot-formatter';
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

Quill.register('modules/imageUploader', ImageUploader);
Quill.register('modules/blotFormatter', BlotFormatter);

Chart.register(ChartDataLabels);
