import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmEmptyTitle]',
  exportAs: 'hlmEmptyTitle',
  host: { 'data-slot': 'empty-title' },
})
export class HlmEmptyTitle {
  constructor() {
    classes(() => 'text-base font-medium tracking-tight');
  }
}
