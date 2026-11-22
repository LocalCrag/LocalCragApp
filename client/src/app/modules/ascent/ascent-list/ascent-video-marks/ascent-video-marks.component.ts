import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideVideo } from '@ng-icons/lucide';
import { Ascent } from '../../../../models/ascent';

@Component({
  selector: 'lc-ascent-video-marks',
  templateUrl: './ascent-video-marks.component.html',
  styleUrl: './ascent-video-marks.component.scss',
  imports: [TranslocoDirective, RouterLink, NgIcon],
  providers: [provideIcons({ lucideVideo })],
})
export class AscentVideoMarksComponent {
  @Input({ required: true }) ascent!: Ascent;
}
