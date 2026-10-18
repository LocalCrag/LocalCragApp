import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { LandingPage } from '../../../enums/landing-page';
import { StartingPosition } from '../../../enums/starting-position';
import { getInstanceTimezoneOptions } from '../../../utility/constants/instance-timezones';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { LanguageSelectComponent } from '../../shared/forms/controls/language-select/language-select.component';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';

@Component({
  selector: 'lc-instance-settings-general-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ButtonModule,
    Select,
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
  public landingPages = LandingPage;
  public landingPageOptions: { label: string; value: LandingPage }[] = [];
  public menuPageOptions: { label: string; value: string }[] = [];
  public menuPagesLoaded = false;
  public startingPositionsOptions: {
    label: string;
    value: StartingPosition;
  }[] = [];
  public rankingPastWeeksOptions: { label: string; value: number | null }[] =
    [];
  public timezoneOptions = getInstanceTimezoneOptions();

  private translocoService = inject(TranslocoService);
  private menuPagesService = inject(MenuPagesService);
  private destroyRef = inject(DestroyRef);

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
    this.landingPageOptions = [
      ...[
        LandingPage.NEWS,
        LandingPage.TOPO,
        LandingPage.ASCENTS,
        LandingPage.RANKING,
        LandingPage.GALLERY,
        LandingPage.HISTORY,
      ].map((page) => ({
        label: this.translocoService.translate(`menu.${page.toLowerCase()}`),
        value: page,
      })),
      {
        label: this.translocoService.translate(
          'instanceSettings.instanceSettingsForm.landingPageMenuPage',
        ),
        value: LandingPage.MENU_PAGE,
      },
    ];
    this.group
      .get('landingPage')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.syncLandingPageSlug(value));
    this.syncLandingPageSlug(this.group.get('landingPage')?.value);
    this.menuPagesService
      .getMenuPages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pages) => {
        this.menuPageOptions = pages.map((page) => ({
          label: page.title,
          value: page.slug,
        }));
        this.menuPagesLoaded = true;
      });
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

  private syncLandingPageSlug(value: LandingPage | null): void {
    const slugControl = this.group.get('landingPageSlug');
    if (!slugControl) {
      return;
    }
    if (value === LandingPage.MENU_PAGE) {
      slugControl.setValidators([Validators.required]);
    } else {
      slugControl.clearValidators();
      if (slugControl.value) {
        slugControl.setValue(null);
      }
    }
    slugControl.updateValueAndValidity();
  }
}
