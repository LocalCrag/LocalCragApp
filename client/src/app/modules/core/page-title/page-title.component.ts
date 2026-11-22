import { AsyncPipe, NgStyle, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { RouterLink } from '@angular/router';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import {
  PageTitleService,
  PageTitleState,
} from '../../../services/core/page-title.service';
import {
  pageTitleDefaultBgStyles,
  pageTitleImageCssVars,
} from '../../../utility/image-focus';
import { MenuItem } from '../../shared/models/menu-item';
import {
  ChromeTab,
  ChromeTabsComponent,
} from '../../shared/components/chrome-tabs/chrome-tabs.component';
import {
  lucideNameFromPrimeIcon,
  sharedLucideIcons,
} from '../../shared/utils/prime-icon';
import { HeroParallaxDirective } from './hero-parallax.directive';

@Component({
  selector: 'lc-page-title',
  templateUrl: './page-title.component.html',
  styleUrl: './page-title.component.scss',
  providers: [provideIcons(sharedLucideIcons)],
  imports: [
    AsyncPipe,
    NgStyle,
    NgTemplateOutlet,
    HlmBreadcrumbImports,
    HlmSkeleton,
    HlmTooltip,
    NgIcon,
    RouterLink,
    ChromeTabsComponent,
    HeroParallaxDirective,
  ],
})
export class PageTitleComponent {
  protected pageTitleService = inject(PageTitleService);
  protected lucideNameFromPrimeIcon = lucideNameFromPrimeIcon;

  protected asChromeTabs(items: MenuItem[] | null | undefined): ChromeTab[] {
    return (items ?? []).map((item, index) => ({
      id: String(index),
      label: item.label,
      icon: item.icon,
      badge: item.badge,
      routerLink: item.routerLink,
      queryParams: item.queryParams,
      visible: item.visible,
      routerLinkActiveOptions: item.routerLinkActiveOptions,
    }));
  }

  protected hasPageHeader(state: PageTitleState): boolean {
    return (
      state.loading ||
      !!state.title ||
      !!state.template ||
      this.hasBreadcrumbs(state) ||
      !!state.tabs?.length
    );
  }

  protected hasBreadcrumbs(state: PageTitleState): boolean {
    return !!state.breadcrumbs?.length;
  }

  protected hasHeroBackground(state: PageTitleState): boolean {
    return !!state.image || state.heroDefaultBg;
  }

  protected heroBackgroundStyles(
    state: PageTitleState,
  ): Record<string, string> {
    if (state.heroDefaultBg && !state.image) {
      return {
        ...pageTitleDefaultBgStyles(),
        ...(state.imageBackgroundStyles ?? {}),
      };
    }

    return {
      ...pageTitleImageCssVars(state.image),
      ...(state.imageBackgroundStyles ?? {}),
    };
  }
}
