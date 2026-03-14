import {
  Component,
  forwardRef,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  LANGUAGE_CODES,
  LanguageCode,
} from '../../../../../utility/types/language';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lc-language-select',
  standalone: true,
  imports: [FormsModule, Select, TranslocoPipe],
  templateUrl: './language-select.component.html',
  styleUrls: ['./language-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LanguageSelectComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class LanguageSelectComponent implements ControlValueAccessor {
  readonly languages = [...LANGUAGE_CODES];
  value: LanguageCode | null = null;
  disabled = false;

  @Input() placeholder: string | undefined;
  @HostBinding('class.no-label')
  @Input()
  noLabel: boolean = false;

  private onChange: (value: LanguageCode | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: LanguageCode | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: LanguageCode | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  getFlagSrc(code: LanguageCode | null): string | undefined {
    if (!code) return undefined;
    return `assets/flags/${code}.svg`;
  }

  onSelect(code: LanguageCode | null): void {
    if (this.disabled) return;
    this.value = code;
    this.onChange(code);
    this.onTouched();
  }
}
