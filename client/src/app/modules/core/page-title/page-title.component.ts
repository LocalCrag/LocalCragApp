import { AsyncPipe, NgStyle, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import {
  PageTitleService,
  PageTitleState,
} from '../../../services/core/page-title.service';
import { SetActiveTabDirective } from '../../shared/directives/set-active-tab.directive';

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
  ],
})
export class PageTitleComponent {
  protected pageTitleService = inject(PageTitleService);

  protected hasChrome(state: PageTitleState): boolean {
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
}
