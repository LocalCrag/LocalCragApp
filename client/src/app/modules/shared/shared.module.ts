import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MomentPipe} from './pipes/moment.pipe';
import {FormDirective} from './forms/form.directive';
import {IfNoErrorDirective} from './forms/if-no-error.directive';
import {IfErrorDirective} from './forms/if-error.directive';
import {FormControlDirective} from './forms/form-control.directive';
import {ControlGroupDirective} from './forms/control-group.directive';
import {MinutesRemainingPipe} from './pipes/minutes-remaining.pipe';
import { LeveledGradeDistributionComponent } from './components/leveled-grade-distribution/leveled-grade-distribution.component';
import {TagModule} from 'primeng/tag';
import {BadgeModule} from 'primeng/badge';


@NgModule({
  declarations: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    LeveledGradeDistributionComponent
  ],
  imports: [
    CommonModule,
    TagModule,
    BadgeModule
  ],
  exports: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    LeveledGradeDistributionComponent
  ]
})
export class SharedModule {
}
