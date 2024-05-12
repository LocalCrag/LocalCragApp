import {Component, ElementRef, HostBinding, HostListener, Input, ViewEncapsulation} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {AngleDownIcon} from 'primeng/icons/angledown';
import {AngleRightIcon} from 'primeng/icons/angleright';
import _default from 'chart.js/dist/plugins/plugin.legend';
import {Router} from '@angular/router';
import {ProcessedMenuItem} from './processed-menu-item';
import {HeaderMenuService} from './header-menu.service';
import {MOBILE_BREAKPOINT_HEADER_MENU} from '../../../../utility/misc/breakpoints';

@Component({
  selector: 'lc-header-menu-sub',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    NgClass,
    AngleDownIcon,
    AngleRightIcon
  ],
  templateUrl: './header-menu-sub.component.html',
  styleUrl: './header-menu-sub.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HeaderMenuSubComponent {

  @Input() model: ProcessedMenuItem[];
  @HostBinding('class.root')
  @Input() root: boolean = false;
  @HostBinding('class.first-child')
  @Input() firstChild: boolean = false;

  constructor(private router: Router,
              private el: ElementRef,
              private headerMenuService: HeaderMenuService) {
  }

  onItemClick(item: ProcessedMenuItem) {
    if (item.item.routerLink) {
      this.router.navigate([item.item.routerLink]);
    }
    if (item.item.url) {
      window.open(item.item.url, item.item.target || '_blank');
    }
    this.headerMenuService.deactivateCurrent();
    this.headerMenuService.collapseMobileMenu();
  }

  /**
   * In non-mobile view, we handle the menu activate / deactivate via hover (mouseenter).
   */
  onMouseenter(item: ProcessedMenuItem) {
    if (window.innerWidth > MOBILE_BREAKPOINT_HEADER_MENU) {
      this.headerMenuService.setActive(item);
    }
  }

  /**
   * In mobile view, we handle the menu activate / deactivate via click on the angle icons.
   */
  onAngleClick(item: ProcessedMenuItem) {
    if (window.innerWidth <= MOBILE_BREAKPOINT_HEADER_MENU) {
      this.headerMenuService.toggleActive(item);
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event) {
    if (this.root && !this.el.nativeElement.contains(event.target)) {
      this.headerMenuService.deactivateCurrent();
      this.headerMenuService.collapseMobileMenu();
    }
  }

}
