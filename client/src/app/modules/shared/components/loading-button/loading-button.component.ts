import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader2 } from '@ng-icons/lucide';
import {
  buttonVariants,
  injectBrnButtonConfig,
  type ButtonVariants,
} from '@spartan-ng/helm/button';
import { classes } from '@spartan-ng/helm/utils';

@Component({
  // The host is the button, so click, type, class, and data-cy stay on the element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[lcLoadingButton]',
  imports: [NgIcon],
  providers: [provideIcons({ lucideLoader2 })],
  templateUrl: './loading-button.component.html',
  styleUrl: './loading-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'button',
    '[attr.disabled]': 'isDisabled() || null',
    '[attr.data-disabled]': 'isDisabled() || null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class LoadingButtonComponent {
  private readonly config = injectBrnButtonConfig();

  readonly variant = input<ButtonVariants['variant']>(this.config.variant);
  readonly size = input<ButtonVariants['size']>(this.config.size);
  /** Icon shown before the label. While loading, the spinner takes this slot. */
  readonly icon = input<string | null>(null);
  /** Place the icon after the label. The spinner still replaces that icon. */
  readonly iconEnd = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly isDisabled = computed(
    () => this.loading() || this.disabled(),
  );

  /** Spinner leads when there is no icon, or the icon itself leads. */
  protected readonly spinnerLeads = computed(
    () => this.loading() && (!this.icon() || !this.iconEnd()),
  );

  protected readonly spinnerFollows = computed(
    () => this.loading() && !!this.icon() && this.iconEnd(),
  );

  constructor() {
    classes(() =>
      buttonVariants({ variant: this.variant(), size: this.size() }),
    );
  }
}
