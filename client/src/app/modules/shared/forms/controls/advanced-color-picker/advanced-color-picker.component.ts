import {
  Component,
  DestroyRef,
  forwardRef,
  inject,
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

import { Store } from '@ngrx/store';
import { FormDirective } from '../../form.directive';
import { selectInstanceSettingsState } from '../../../../../ngrx/selectors/instance-settings.selectors';
import { NgIf } from '@angular/common';
import { FormControlDirective } from '../../form-control.directive';
import { NgxColorsModule } from 'ngx-colors';
import { Select } from 'primeng/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-advanced-color-picker',
  imports: [
    TranslocoDirective,
    ColorPickerModule,
    ReactiveFormsModule,
    SelectButtonModule,
    NgIf,
    FormControlDirective,
    FormDirective,
    NgxColorsModule,
    Select,
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
  public palette = [
    '#ffd811',
    '#ff6811',
    '#f10d0d',
    '#078001',
    '#0e34b2',
    '#ff1ec4',
    '#6402fd',
    '#ffffff',
    '#545454',
    '#000000',
  ];

  public dropdownOptions: { label: string; value: boolean }[] = [];

  private changeHandlers = [];
  private color: string | null = null;
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private inj = inject(Injector);
  private store = inject(Store);

  ngOnInit() {
    this.formControl = this.inj.get(NgControl);
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.colorForm = this.fb.group({
          customColor: [instanceSettings.gymMode],
          color: [instanceSettings.arrowColor],
        });
        this.dropdownOptions = [
          { label: this.translateLabel('globalColor'), value: false },
          { label: this.translateLabel('customColor'), value: true },
        ];
        this.colorForm.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(this.onChange.bind(this));
        this.isInitalized = true; // We need some extra initialization as colorForm gets populated asynchronously
        for (const fn of this.deferredCalls) fn();
      });
  }

  private translateLabel(key: string): string {
    // Use Transloco if available, fallback to key
    // This assumes you have a translation pipe or service
    // Replace with your actual translation logic if needed
    return key;
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
