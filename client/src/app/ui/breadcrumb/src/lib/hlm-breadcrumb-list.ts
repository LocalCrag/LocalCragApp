import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmBreadcrumbList]',
  exportAs: 'hlmBreadcrumbList',
  host: {
    'data-slot': 'breadcrumb-list',
  },
})
export class HlmBreadcrumbList {
  constructor() {
    classes(
      () =>
        'text-muted-foreground gap-1.5 text-base flex flex-wrap items-center wrap-break-word',
    );
  }
}
