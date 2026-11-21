import type { BooleanInput } from '@angular/cdk/coercion';
import type { ComponentType } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';

import { classes } from '@spartan-ng/helm/utils';
import { HlmDialogClose } from './hlm-dialog-close';
import { HlmDialogTitle } from './hlm-dialog-title';

type HlmDialogContentContext = {
  $component?: ComponentType<unknown>;
  $dynamicComponentClass?: string;
  $title?: string;
  $showCloseButton?: boolean;
  $closeLabel?: string;
};

@Component({
  selector: 'hlm-dialog-content',
  exportAs: 'hlmDialogContent',
  imports: [
    NgComponentOutlet,
    HlmButton,
    HlmDialogClose,
    HlmDialogTitle,
    NgIcon,
  ],
  providers: [provideIcons({ lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'dialog-content',
    '[attr.data-state]': 'state()',
  },
  template: `
    @if (title()) {
      <div class="flex items-center justify-between gap-3">
        <h2 hlmDialogTitle class="min-w-0">{{ title() }}</h2>
        @if (showCloseButton()) {
          <button
            hlmBtn
            variant="ghost"
            size="icon-sm"
            class="-me-2 shrink-0 cursor-pointer"
            hlmDialogClose
          >
            <span class="sr-only">{{ closeLabel() }}</span>
            <ng-icon name="lucideX" />
          </button>
        }
      </div>
    }

    @if (component) {
      <ng-container [ngComponentOutlet]="component" />
    } @else {
      <ng-content />
    }

    @if (showCloseButton() && !title()) {
      <button
        hlmBtn
        variant="ghost"
        size="icon-sm"
        class="absolute end-2 top-3.5 cursor-pointer"
        hlmDialogClose
      >
        <span class="sr-only">{{ closeLabel() }}</span>
        <ng-icon name="lucideX" />
      </button>
    }
  `,
})
export class HlmDialogContent {
  private readonly _dialogRef = inject(BrnDialogRef);
  private readonly _dialogContext =
    injectBrnDialogContext<HlmDialogContentContext | null>({ optional: true });

  public readonly title = input<string>(this._dialogContext?.$title ?? '');

  public readonly showCloseButton = input<boolean, BooleanInput>(
    this._dialogContext?.$showCloseButton ?? true,
    {
      transform: booleanAttribute,
    },
  );
  public readonly closeLabel = input<string>(
    this._dialogContext?.$closeLabel ?? 'Close',
  );

  public readonly state = computed(() => this._dialogRef?.state() ?? 'closed');

  public readonly component = this._dialogContext?.$component;
  private readonly _dynamicComponentClass =
    this._dialogContext?.$dynamicComponentClass;

  constructor() {
    classes(() => [
      'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-base ring-1 duration-100 sm:max-w-sm relative mx-auto w-[calc(100vw-2rem)] outline-none sm:mx-0',
      this._dynamicComponentClass,
    ]);
  }
}
