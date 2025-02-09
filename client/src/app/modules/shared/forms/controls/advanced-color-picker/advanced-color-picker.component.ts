import {
  Component,
  forwardRef,
  Injector,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { FormDirective } from '../../form.directive';
import { selectInstanceSettingsState } from '../../../../../ngrx/selectors/instance-settings.selectors';
import { ColorSquareComponent } from '../../../components/color-square/color-square.component';
import { SharedModule } from '../../../shared.module';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lc-advanced-color-picker',
  standalone: true,
  imports: [
    TranslocoDirective,
    ColorPickerModule,
    ReactiveFormsModule,
    ColorSquareComponent,
    SelectButtonModule,
    SharedModule,
    NgIf,
  ],
  templateUrl: './advanced-color-picker.component.html',
  styleUrl: './advanced-color-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AdvancedColorPickerComponent),
      multi: true,
    },
  ],
})
@UntilDestroy()
export class AdvancedColorPickerComponent
  implements OnInit, ControlValueAccessor
{
  @ViewChild(FormDirective) formDirective: FormDirective;

  @Input() public id?: string;

  public formControl: NgControl;
  public isDisabled = false;
  public colorForm: FormGroup;
  public isInitalized = false;
  public deferredCalls: (() => any)[] = [];

  private changeHandlers = [];
  private color: string | null = null;

  constructor(
    private fb: FormBuilder,
    private inj: Injector,
    private store: Store,
  ) {}

  ngOnInit() {
    this.formControl = this.inj.get(NgControl);
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.colorForm = this.fb.group({
          customColor: [instanceSettings.gymMode],
          color: [instanceSettings.arrowColor],
        });
        this.colorForm.valueChanges
          .pipe(untilDestroyed(this))
          .subscribe(this.onChange.bind(this));
        this.isInitalized = true; // We need some extra initialization as colorForm gets populated asynchronously
        for (const fn of this.deferredCalls) fn();
      });
  }

  writeValue(color: string | null) {
    if (!this.isInitalized) {
      this.deferredCalls.push(() => this.writeValue(color));
      return;
    }

    if (color) {
      this.colorForm.patchValue({
        customColor: true,
        color: color,
      });
    } else {
      this.colorForm.patchValue({
        customColor: false,
      });
    }
  }

  registerOnChange(fn: any) {
    this.changeHandlers.push(fn);
  }

  registerOnTouched(_fn: any) {}

  onChange() {
    if (!this.isInitalized) {
      this.deferredCalls.push(() => this.onChange());
      return;
    }

    this.color = this.colorForm.get('customColor').value
      ? this.colorForm.get('color').value
      : null;

    for (const handler of this.changeHandlers) {
      handler(this.color);
    }
  }

  setDisabledState(isDisabled: boolean): void {
    if (!this.isInitalized) {
      this.deferredCalls.push(() => this.setDisabledState(isDisabled));
      return;
    }

    this.isDisabled = isDisabled;
    if (this.isDisabled) this.colorForm.disable();
    else this.colorForm.enable();
  }
}
