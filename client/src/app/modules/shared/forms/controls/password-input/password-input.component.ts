import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  HlmInputGroup,
  HlmInputGroupImports,
} from '@spartan-ng/helm/input-group';

@Component({
  selector: 'lc-password-input',
  templateUrl: './password-input.component.html',
  styleUrl: './password-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmInputGroupImports, NgIcon, TranslocoPipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
    provideIcons({ lucideEye, lucideEyeOff }),
  ],
  hostDirectives: [HlmInputGroup],
})
export class PasswordInputComponent implements ControlValueAccessor {
  readonly placeholder = input('');
  readonly autocomplete = input<string | null>(null);

  protected readonly value = signal('');
  protected readonly visible = signal(false);
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected touch(): void {
    this.onTouched();
  }

  protected toggle(): void {
    this.visible.update((shown) => !shown);
  }
}
