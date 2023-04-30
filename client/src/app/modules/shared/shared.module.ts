import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MomentPipe} from './pipes/moment.pipe';
import {FormDirective} from './forms/form.directive';
import {IfNoErrorDirective} from './forms/if-no-error.directive';
import {IfErrorDirective} from './forms/if-error.directive';
import {FormControlDirective} from './forms/form-control.directive';
import {ControlGroupDirective} from './forms/control-group.directive';
import {MinutesRemainingPipe} from './pipes/minutes-remaining.pipe';


@NgModule({
  declarations: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe
  ]
})
export class SharedModule {
}
