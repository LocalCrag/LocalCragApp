import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { SetActiveTabDirective } from '../../directives/set-active-tab.directive';
import { MenuItem } from '../../models/menu-item';
import {
  lucideNameFromPrimeIcon,
  sharedLucideIcons,
} from '../../utils/prime-icon';

export interface ChromeTab {
  id: string;
  label?: string;
  icon?: string;
  badge?: string | number | null;
  routerLink?: MenuItem['routerLink'];
  queryParams?: MenuItem['queryParams'];
  visible?: boolean;
  routerLinkActiveOptions?: MenuItem['routerLinkActiveOptions'];
}

@Component({
  selector: 'lc-chrome-tabs',
  templateUrl: './chrome-tabs.component.html',
  styleUrl: './chrome-tabs.component.scss',
  host: {
    class: 'chrome-tabs',
    '[class.chrome-tabs--overlay]': 'appearance() === "overlay"',
    '[class.chrome-tabs--plain]': 'appearance() !== "overlay"',
  },
  providers: [provideIcons(sharedLucideIcons)],
  imports: [
    HlmBadge,
    HlmTabsImports,
    NgIcon,
    RouterLink,
    SetActiveTabDirective,
  ],
})
export class ChromeTabsComponent {
  /** Tab id to show as active. Ignored while `syncWithRouter` is set. */
  readonly tab = input<string | null>(null);
  readonly tabs = input<ChromeTab[]>([]);
  /** `overlay` matches the tabs on a topo header image. `plain` is the PrimeNG underline row. */
  readonly appearance = input<'overlay' | 'plain'>('plain');
  /** Select the tab whose routerLink matches the current URL. */
  readonly syncWithRouter = input(false);
  readonly tabActivated = output<string>();

  protected readonly routerItems = computed(() => this.tabs() as MenuItem[]);
  protected readonly lucideNameFromPrimeIcon = lucideNameFromPrimeIcon;

  protected onActivated(tab: string): void {
    this.tabActivated.emit(tab);
  }
}
