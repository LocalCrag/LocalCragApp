import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {CoreModule} from './app/modules/core/core.module';
import {environment} from './environments/environment';

import Quill from 'quill';
import ImageUploader from 'quill-image-uploader';
import {Chart} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import BlotFormatter from 'quill-blot-formatter';
import * as Sentry from '@sentry/angular';

if (environment.production) {
  Sentry.init({
    // According to Sentry: DSNs are safe to keep public (will be public anyway in the client-side code)
    dsn: 'https://7f45d91681b814a38e39e42ae68f25db@o4507560433811456.ingest.de.sentry.io/4507560581595216',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', '127.0.0.1'],
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(CoreModule)
  .catch((err) => console.error(err));

Quill.register('modules/imageUploader', ImageUploader);
Quill.register('modules/blotFormatter', BlotFormatter);

Chart.register(ChartDataLabels);
