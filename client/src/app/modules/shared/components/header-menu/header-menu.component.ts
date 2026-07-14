import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  inject,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { HeaderMenuSubComponent } from './header-menu-sub.component';
import { ProcessedMenuItem } from './processed-menu-item';
import { HeaderMenuService } from './header-menu.service';
import { MOBILE_BREAKPOINT_HEADER_MENU } from '../../../../utility/misc/breakpoints';
import { Button } from 'primeng/button';

@Component({
  selector: 'lc-header-menu',
  imports: [NgTemplateOutlet, HeaderMenuSubComponent, NgClass, Button],
  templateUrl: './header-menu.component.html',
  styleUrl: './header-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HeaderMenuService],
})
export class HeaderMenuComponent implements OnChanges, OnInit {
  @Input() model: MenuItem[];

  @ContentChild('start', { static: true }) startTemplate: TemplateRef<any>;
  @ContentChild('end', { static: true }) endTemplate: TemplateRef<any>;

  public processedModel: ProcessedMenuItem[];
  public isMobile = false;
  public mobileExpanded = false;
  /**
   * True when the horizontal link menu does not fit and nav items should move into
   * the burger menu. Set by `MenuComponent.reconcileNavbarOverflow()` — not reset on
   * window resize here; reconciliation owns the full collapse state.
   *
   * Also true implicitly on small viewports via {@link isMobile} in the template
   * (`isMobile || overflowDetected`).
   */
  public overflowDetected = false;

  readonly elementRef = inject(ElementRef);

  private headerMenuService = inject(HeaderMenuService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.handleOnResize(Number(window.innerWidth));
    this.headerMenuService.registerHeaderMenu(this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']) {
      this.processedModel = this.processItems(this.model ?? [], null);
      this.cdr.markForCheck();
    }
  }

  /** True when the menubar content is wider than its container (`scrollWidth > offsetWidth`). */
  isOverflowing(): boolean {
    const element = this.elementRef.nativeElement as HTMLElement;
    return element.offsetWidth < element.scrollWidth;
  }

  /** Updates {@link overflowDetected} during navbar reconciliation in `MenuComponent`. */
  setOverflowDetected(overflowDetected: boolean) {
    if (this.overflowDetected === overflowDetected) {
      return;
    }
    this.overflowDetected = overflowDetected;
    this.cdr.markForCheck();
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

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const width = (event.target as Window).innerWidth;
    this.handleOnResize(width);
  }

  /**
   * Updates the mobile breakpoint flag. Nav overflow is reconciled by `MenuComponent`.
   * @param width innerWidth of the window
   */
  handleOnResize(width: number) {
    this.isMobile = width <= MOBILE_BREAKPOINT_HEADER_MENU;
  }

  toggleMobileMenu() {
    this.mobileExpanded =
      (this.isMobile || this.overflowDetected) && !this.mobileExpanded;
    this.headerMenuService.setPreventNextMobileMenuCollapse(
      this.mobileExpanded,
    );
    this.cdr.detectChanges();
  }
}
