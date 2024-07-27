import {ChangeDetectorRef, Component, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {NgClass, NgIf} from '@angular/common';
import {SharedModule} from 'primeng/api';
import {Line} from '../../../models/line';
import {AscentFormComponent} from '../ascent-form/ascent-form.component';
import {AscentFormTitleComponent} from '../ascent-form-title/ascent-form-title.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {Store} from '@ngrx/store';
import {selectInstanceSettingsState} from '../../../ngrx/selectors/instance-settings.selectors';
import {take} from 'rxjs/operators';
import {marker} from '@ngneat/transloco-keys-manager/marker';

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

  constructor(private dialogService: DialogService,
              private translocoService: TranslocoService,
              private store: Store) {
  }


  addAscent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if(this.line.grade.value >= 0) {
      this.ref = this.dialogService.open(AscentFormComponent, {
        focusOnShow: false,
        templates: {
          header: AscentFormTitleComponent,
        },
        data: {
          line: this.line
        },
      });
    } else {
      this.store.select(selectInstanceSettingsState).pipe(take(1)).subscribe(instanceSettingsState => {
        const subject = this.translocoService.translate(marker('iClimbedAProject'));
        let message = this.translocoService.translate(marker('mailHeaderText')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('whichProjectDidYouClimb')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('whenDidYouClimbIt')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('howDidYouNameIt')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('howDidYouGradeIt')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('howWouldYouRateIt')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('doYouHaveAVideo')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('isTheLineDrawnCorrectly')) + `%0D%0A%0D%0A`;
        message += this.translocoService.translate(marker('mailFooterText')) + `%0D%0A%0D%0A`;
        window.location.href = `mailto:${instanceSettingsState.superadminEmail}?subject=${subject}&body=${message}`;
      })
    }
  }

}
