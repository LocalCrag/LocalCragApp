import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LineComponent} from './line/line.component';
import {LineFormComponent} from './line-form/line-form.component';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@jsverse/transloco';
import {CardModule} from 'primeng/card';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {TagModule} from 'primeng/tag';
import {BadgeModule} from 'primeng/badge';
import {MessagesModule} from 'primeng/messages';
import {EditorModule} from 'primeng/editor';
import {TabMenuModule} from 'primeng/tabmenu';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {SkeletonModule} from 'primeng/skeleton';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {RatingModule} from 'primeng/rating';
import {CalendarModule} from 'primeng/calendar';
import {CheckboxModule} from 'primeng/checkbox';
import {LineBoolPropListComponent} from './line-bool-prop-list/line-bool-prop-list.component';
import {LineInfoComponent} from './line-info/line-info.component';
import {TopoImageDetailsComponent} from '../topo-images/topo-image-details/topo-image-details.component';
import {HasPermissionDirective} from '../shared/directives/has-permission.directive';
import {TickButtonComponent} from '../ascent/tick-button/tick-button.component';
import {AscentCountComponent} from '../ascent/ascent-count/ascent-count.component';
import {SecretSpotTagComponent} from '../shared/components/secret-spot-tag/secret-spot-tag.component';
import {FormSkeletonComponent} from '../shared/components/form-skeleton/form-skeleton.component';
import {TodoButtonComponent} from '../todo/todo-button/todo-button.component';
import { ArchiveButtonComponent } from '../archive/archive-button/archive-button.component';

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
    InputTextareaModule,
    ButtonModule,
    DataViewModule,
    TagModule,
    BadgeModule,
    RouterLink,
    DropdownModule,
    MessagesModule,
    EditorModule,
    TabMenuModule,
    ConfirmPopupModule,
    SkeletonModule,
    BreadcrumbModule,
    RatingModule,
    CalendarModule,
    CheckboxModule,
    TopoImageDetailsComponent,
    HasPermissionDirective,
    TickButtonComponent,
    AscentCountComponent,
    SecretSpotTagComponent,
    FormSkeletonComponent,
    TodoButtonComponent,
    ArchiveButtonComponent,
  ],
  exports: [LineBoolPropListComponent],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'line' }],
})
export class LineModule {}
