import { AsyncPipe, NgStyle, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import {
  PageTitleService,
  PageTitleState,
} from '../../../services/core/page-title.service';
import {
  pageTitleDefaultBgStyles,
  pageTitleImageCssVars,
} from '../../../utility/image-focus';
import { SetActiveTabDirective } from '../../shared/directives/set-active-tab.directive';
import { HeroParallaxDirective } from './hero-parallax.directive';

@Component({
  selector: 'lc-page-title',
  templateUrl: './page-title.component.html',
  styleUrl: './page-title.component.scss',
  imports: [
    AsyncPipe,
    NgStyle,
    NgTemplateOutlet,
    Breadcrumb,
    Tabs,
    TabList,
    Tab,
    RouterLink,
    SetActiveTabDirective,
    HeroParallaxDirective,
  ],
})
export class PageTitleComponent {
  protected pageTitleService = inject(PageTitleService);

  protected hasPageHeader(state: PageTitleState): boolean {
    return (
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
