import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { StartingPosition } from '../../../enums/starting-position';
import { getInstanceTimezoneOptions } from '../../../utility/constants/instance-timezones';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { LanguageSelectComponent } from '../../shared/forms/controls/language-select/language-select.component';

@Component({
  selector: 'lc-instance-settings-general-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ButtonModule,
    Select,
    ToggleSwitch,
    InputTextModule,
    TooltipModule,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    LanguageSelectComponent,
  ],
  templateUrl: './instance-settings-general-tab.component.html',
  styleUrl: './instance-settings-general-tab.component.scss',
})
export class InstanceSettingsGeneralTabComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;

  public faDefaultFormats = FaDefaultFormat;
  public startingPositionsOptions: {
    label: string;
    value: StartingPosition;
  }[] = [];
  public rankingPastWeeksOptions: { label: string; value: number | null }[] =
    [];
  public timezoneOptions = getInstanceTimezoneOptions();

  private translocoService = inject(TranslocoService);

  ngOnInit(): void {
    const startingPositions = [
      StartingPosition.STAND,
      StartingPosition.SIT,
      StartingPosition.CROUCH,
      StartingPosition.LAYDOWN,
      StartingPosition.FRENCH,
      StartingPosition.CANDLE,
    ];
    this.startingPositionsOptions = startingPositions.map((sp) => ({
      label: this.translocoService.translate(sp),
      value: sp,
    }));
    this.rankingPastWeeksOptions = [
      {
        label: this.translocoService.translate(
          'instanceSettings.instanceSettingsForm.rankingPastWeeksAll',
        ),
        value: null,
      },
      ...Array.from({ length: 20 }, (_, i) => i + 1).map((w) => ({
        label:
          w === 1
            ? this.translocoService.translate(
                'instanceSettings.instanceSettingsForm.rankingPastWeeksWeek',
              )
            : this.translocoService.translate(
                'instanceSettings.instanceSettingsForm.rankingPastWeeksWeeks',
                { weeks: w },
              ),
        value: w,
      })),
    ];
  }
}
