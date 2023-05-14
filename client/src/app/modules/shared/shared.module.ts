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
import { SingleImageUploadComponent } from './forms/controls/single-image-upload/single-image-upload.component';
import {FileUploadModule} from 'primeng/fileupload';
import {ImageModule} from 'primeng/image';


@NgModule({
  declarations: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    LeveledGradeDistributionComponent,
    SingleImageUploadComponent
  ],
    imports: [
        CommonModule,
        TagModule,
        BadgeModule,
        FileUploadModule,
        ImageModule
    ],
  exports: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    LeveledGradeDistributionComponent,
    SingleImageUploadComponent
  ]
})
export class SharedModule {
}
