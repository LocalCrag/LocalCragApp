import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LineComponent } from './line/line.component';
import { LineFormComponent } from './line-form/line-form.component';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { EditorModule } from 'primeng/editor';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { SkeletonModule } from 'primeng/skeleton';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RatingModule } from 'primeng/rating';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { LineBoolPropListComponent } from './line-bool-prop-list/line-bool-prop-list.component';
import { LineInfoComponent } from './line-info/line-info.component';
import { TopoImageDetailsComponent } from '../topo-images/topo-image-details/topo-image-details.component';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';
import { TickButtonComponent } from '../ascent/tick-button/tick-button.component';
import { AscentCountComponent } from '../ascent/ascent-count/ascent-count.component';
import { SecretSpotTagComponent } from '../shared/components/secret-spot-tag/secret-spot-tag.component';
import { FormSkeletonComponent } from '../shared/components/form-skeleton/form-skeleton.component';
import { TodoButtonComponent } from '../todo/todo-button/todo-button.component';
import { ClosedSpotTagComponent } from '../shared/components/closed-spot-tag/closed-spot-tag.component';
import { ClosedSpotAlertComponent } from '../shared/components/closed-spot-alert/closed-spot-alert.component';
import { GymModeDirective } from '../shared/directives/gym-mode.directive';
import { ColorSquareComponent } from '../shared/components/color-square/color-square.component';
import { ArchiveButtonComponent } from '../archive/archive-button/archive-button.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AdvancedColorPickerComponent } from '../shared/forms/controls/advanced-color-picker/advanced-color-picker.component';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { SetActiveTabDirective } from '../shared/directives/set-active-tab.directive';
import { Tab, TabList, Tabs } from 'primeng/tabs';

@NgModule({
  declarations: [
    LineComponent,
    LineFormComponent,
    LineBoolPropListComponent,
    LineInfoComponent,
  ],
  imports: [
    CommonModule,
    CardModule,
    TranslocoModule,
    SharedModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DataViewModule,
    TagModule,
    BadgeModule,
    RouterLink,
    EditorModule,
    ConfirmPopupModule,
    SkeletonModule,
    BreadcrumbModule,
    RatingModule,
    DatePickerModule,
    CheckboxModule,
    ColorPickerModule,
    TopoImageDetailsComponent,
    HasPermissionDirective,
    TickButtonComponent,
    AscentCountComponent,
    SecretSpotTagComponent,
    FormSkeletonComponent,
    TodoButtonComponent,
    ClosedSpotTagComponent,
    ClosedSpotAlertComponent,
    GymModeDirective,
    ColorSquareComponent,
    ArchiveButtonComponent,
    SelectButtonModule,
    AdvancedColorPickerComponent,
    Message,
    Select,
    RouterOutlet,
    SetActiveTabDirective,
    Tab,
    TabList,
    Tabs,
  ],
  exports: [LineBoolPropListComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'line' }],
})
export class LineModule {}
