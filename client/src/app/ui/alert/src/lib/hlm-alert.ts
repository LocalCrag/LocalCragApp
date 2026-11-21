import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const alertVariants = cva(
  "grid items-center gap-0.5 rounded-lg border px-2.5 py-2 text-start text-base has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18 has-[>ng-icon]:grid-cols-[auto_1fr] has-[>ng-icon]:gap-x-2 *:[ng-icon]:self-center *:[ng-icon]:text-current *:[ng-icon:not([class*='text-'])]:text-[length:--spacing(4)] group/alert relative w-full",
  {
    variants: {
      variant: {
        default:
          'border-primary/30 bg-primary/10 text-foreground *:data-[slot=alert-description]:text-foreground *:[ng-icon]:text-primary',
        warning:
          'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 *:data-[slot=alert-description]:text-amber-950 dark:*:data-[slot=alert-description]:text-amber-200 *:[ng-icon]:text-current',
        destructive:
          'text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 *:[ng-icon]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;

@Directive({
  selector: 'hlm-alert,[hlmAlert]',
  exportAs: 'hlmAlert',
  host: {
    'data-slot': 'alert',
    role: 'alert',
  },
})
export class HlmAlert {
  public readonly variant = input<AlertVariants['variant']>('default');

  constructor() {
    classes(() => alertVariants({ variant: this.variant() }));
  }
}
