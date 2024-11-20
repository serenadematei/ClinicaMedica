import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerables } from 'chart.js';
import { Chart } from 'chart.js';

Chart.register(...registerables);


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
