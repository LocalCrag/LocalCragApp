import {Component, Input, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {NgClass, NgIf} from '@angular/common';
import {SharedModule} from 'primeng/api';
import {Line} from '../../../models/line';
import {AscentFormComponent} from '../ascent-form/ascent-form.component';
import {AscentFormTitleComponent} from '../ascent-form-title/ascent-form-title.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {TranslocoDirective} from '@ngneat/transloco';

@Component({
  selector: 'lc-tick-button',
  standalone: true,
  imports: [
    ButtonModule,
    NgIf,
    SharedModule,
    NgClass,
    TranslocoDirective
  ],
  templateUrl: './tick-button.component.html',
  styleUrl: './tick-button.component.scss',
  providers: [
    DialogService,
  ],
   encapsulation: ViewEncapsulation.None
})
export class TickButtonComponent {

  @Input() line: Line;
  @Input() ticked: boolean;
  @Input() showLabel: boolean;

  public ref: DynamicDialogRef | undefined;

  constructor(private dialogService: DialogService) {
  }


  addAscent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.ref = this.dialogService.open(AscentFormComponent, {
      templates: {
        header: AscentFormTitleComponent,
      },
      data: {
        line: this.line
      },
    });
  }

}
