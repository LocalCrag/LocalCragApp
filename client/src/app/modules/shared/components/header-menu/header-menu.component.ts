import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  QueryList,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import {MenuItem, PrimeTemplate} from 'primeng/api';
import {NgClass, NgIf, NgTemplateOutlet} from '@angular/common';
import {HeaderMenuSubComponent} from './header-menu-sub.component';
import {ProcessedMenuItem} from './processed-menu-item';
import {HeaderMenuService} from './header-menu.service';
import {MOBILE_BREAKPOINT_HEADER_MENU} from '../../../../utility/misc/breakpoints';
import {BarsIcon} from 'primeng/icons/bars';

@Component({
  selector: 'lc-header-menu',
  standalone: true,
  imports: [NgIf, NgTemplateOutlet, HeaderMenuSubComponent, BarsIcon, NgClass],
  templateUrl: './header-menu.component.html',
  styleUrl: './header-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HeaderMenuService],
})
export class HeaderMenuComponent
  implements AfterContentInit, OnChanges, OnInit
{
  @Input() model: MenuItem[];

  @ContentChildren(PrimeTemplate) templates:
    | QueryList<PrimeTemplate>
    | undefined;

  processedModel: ProcessedMenuItem[];
  startTemplate: TemplateRef<any> | undefined;
  endTemplate: TemplateRef<any> | undefined;
  isMobile = false;
  mobileExpanded = false;

  constructor(private headerMenuService: HeaderMenuService) {}

  ngAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case 'start':
          this.startTemplate = item.template;
          break;
        case 'end':
          this.endTemplate = item.template;
          break;
      }
    });
  }

  ngOnInit() {
    this.onResize(Number(window.innerWidth));
    this.headerMenuService.registerHeaderMenu(this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']) {
      this.processedModel = this.processItems(this.model, null);
    }
  }

  processItems(
    items: MenuItem[],
    parent: ProcessedMenuItem,
  ): ProcessedMenuItem[] {
    return items.map((item) => {
      const processedItem = {
        item: item,
        parent,
        isActive: false,
        items: null,
      };
      if (item.items) {
        processedItem.items = this.processItems(item.items, processedItem);
      }
      return processedItem;
    });
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.isMobile = width <= MOBILE_BREAKPOINT_HEADER_MENU;
  }

  toggleMobileMenu(event) {
    event.stopPropagation();
    this.mobileExpanded = this.isMobile && !this.mobileExpanded;
  }
}
