import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {CoreModule} from './app/modules/core/core.module';
import {environment} from './environments/environment';

import Quill from "quill";
import ImageUploader from "quill-image-uploader";
import {Chart} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import BlotFormatter from 'quill-blot-formatter';


if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(CoreModule)
  .catch(err => console.error(err));

Quill.register("modules/imageUploader", ImageUploader);
Quill.register('modules/blotFormatter', BlotFormatter);




Chart.register(ChartDataLabels);


