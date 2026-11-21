import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChildren,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { DOCUMENT, NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Router } from '@angular/router';
import { ProcessedMenuItem } from './processed-menu-item';
import { HeaderMenuService } from './header-menu.service';
import {
  lucideNameFromPrimeIcon,
  sharedLucideIcons,
} from '../../utils/prime-icon';

@Component({
  selector: 'lc-header-menu-sub',
  imports: [NgClass, NgIcon],
  providers: [provideIcons(sharedLucideIcons)],
  templateUrl: './header-menu-sub.component.html',
  styleUrl: './header-menu-sub.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderMenuSubComponent implements OnInit, OnDestroy {
  @Input() model: ProcessedMenuItem[];
  @HostBinding('class.root')
  @Input()
  root: boolean = false;
  @HostBinding('class.first-child')
  @Input()
  firstChild: boolean = false;
  @Input() isMobile: boolean;

  @ViewChildren('menuItem') menuItems: QueryList<ElementRef>;
  @ViewChildren(HeaderMenuSubComponent)
  private childMenus: QueryList<HeaderMenuSubComponent>;

  private router = inject(Router);
  private el = inject(ElementRef);
  private headerMenuService = inject(HeaderMenuService);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private cdr = inject(ChangeDetectorRef);
  private unlistenDocumentClick?: () => void;

  ngOnInit() {
    // Every submenu used to listen for document clicks. Each listener schedules
    // its own change detection pass, so one click refreshed the whole app once
    // per submenu. Only the root menu needs to close itself on an outside click.
    if (!this.root) {
      return;
    }
    this.unlistenDocumentClick = this.renderer.listen(
      this.document,
      'click',
      (event: Event) => this.handleOutsideClick(event),
    );
  }

  ngOnDestroy() {
    this.unlistenDocumentClick?.();
  }

  iconName(icon?: string): string | null {
    return lucideNameFromPrimeIcon(icon);
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
  onMouseenter(item: ProcessedMenuItem, element: HTMLDivElement) {
    if (!this.isMobile) {
      const submenuElement = element.querySelector(
        'lc-header-menu-sub',
      ) as HTMLElement;
      const isFirstChild = submenuElement?.classList.contains('first-child');
      const panelElement = isFirstChild
        ? null
        : (element.parentElement as HTMLElement);
      this.headerMenuService.setActive(
        item,
        submenuElement,
        element,
        isFirstChild,
        panelElement,
      );
    }
  }

  /**
   * In mobile view, we handle the menu activate / deactivate via click on the angle icons.
   */
  onAngleClick(item: ProcessedMenuItem) {
    if (this.isMobile) {
      this.headerMenuService.toggleActive(item);
    }
  }

  handleOutsideClick(event: Event) {
    if (this.root && !this.el.nativeElement.contains(event.target)) {
      this.headerMenuService.deactivateCurrent();
      this.headerMenuService.collapseMobileMenu();
      // Document clicks are not template events, and these menus are OnPush.
      // The header's change detector does not refresh them, so the open class
      // stays on screen after the fixed position has already been cleared.
      this.refreshOpenState();
    }
  }

  /**
   * Re-renders this menu and any open nested one so `isActive` matches the DOM.
   * Parent `detectChanges` skips OnPush children, so each open menu refreshes itself.
   */
  refreshOpenState() {
    const openChildren =
      this.childMenus?.filter((child) =>
        child.el.nativeElement.classList.contains('is-active'),
      ) ?? [];
    this.cdr.detectChanges();
    openChildren.forEach((child) => child.refreshOpenState());
  }
}
