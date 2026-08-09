import { enableProdMode, provideZoneChangeDetection } from '@angular/core';

import { environment } from './environments/environment';

import Quill from 'quill';
import ImageUploader from 'quill-image-uploader';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import BlotFormatter from 'quill-blot-formatter';
import { bootstrapApplication } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { appConfig } from './app/modules/core/app.config';
import { CoreComponent } from './app/modules/core/core.component';
import {
  resolveApiHost,
  RUNTIME_API_HOST,
} from './app/services/core/runtime-api-host';

if (environment.production) {
  enableProdMode();
}

Quill.register('modules/imageUploader', ImageUploader);
Quill.register('modules/blotFormatter', BlotFormatter);

Chart.register(ChartDataLabels);

async function main(): Promise<void> {
  // Resolve Preferences-backed host before any Angular initializer can construct
  // ApiService (INST-01 / D-01 — avoids APP_INITIALIZER race with instance-settings).
  const apiHost = await resolveApiHost();
  await bootstrapApplication(CoreComponent, {
    ...appConfig,
    providers: [
      provideZoneChangeDetection(),
      { provide: RUNTIME_API_HOST, useValue: apiHost },
      ...appConfig.providers,
    ],
  });
  if (Capacitor.isNativePlatform()) {
    void SplashScreen.hide();
  }
}

main().catch((err) => console.error(err));
