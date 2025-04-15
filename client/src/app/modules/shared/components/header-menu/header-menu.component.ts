import {
  AfterViewInit,
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
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { NgClass, NgIf, NgTemplateOutlet } from '@angular/common';
import { HeaderMenuSubComponent } from './header-menu-sub.component';
import { ProcessedMenuItem } from './processed-menu-item';
import { HeaderMenuService } from './header-menu.service';
import { MOBILE_BREAKPOINT_HEADER_MENU } from '../../../../utility/misc/breakpoints';
import { BarsIcon } from 'primeng/icons/bars';

@Component({
  selector: 'lc-header-menu',
  imports: [NgIf, NgTemplateOutlet, HeaderMenuSubComponent, BarsIcon, NgClass],
  templateUrl: './header-menu.component.html',
  styleUrl: './header-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [HeaderMenuService],
})
export class HeaderMenuComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() model: MenuItem[];

  @ContentChild('start', { static: true }) startTemplate: TemplateRef<any>;
  @ContentChild('end', { static: true }) endTemplate: TemplateRef<any>;

  public processedModel: ProcessedMenuItem[];
  public isMobile = false;
  public mobileExpanded = false;
  public overflowDetected = false;

  private resizeObserver!: ResizeObserver;

  constructor(
    private headerMenuService: HeaderMenuService,
    private cdr: ChangeDetectorRef,
    private el: ElementRef,
  ) {}

  ngOnInit() {
    this.onResize(Number(window.innerWidth));
    this.headerMenuService.registerHeaderMenu(this);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['model']) {
      this.processedModel = this.processItems(this.model, null);
    }
  }

  /**
   * Set the overflowDetected flag if the menu is overflowing.
   */
  setOverflowDetected() {
    // Don't run if it's already detected. As the menu is not overflowing anymore
    // after the mobile version is shown, this check is necessary.
    if (!this.overflowDetected) {
      const width = this.el.nativeElement.offsetWidth;
      this.overflowDetected = width < this.el.nativeElement.scrollWidth;
      if (this.overflowDetected) {
        // Change detection needed as this happens after the regular cycle
        this.cdr.detectChanges();
      }
    }
  }

  ngAfterViewInit() {
    this.setOverflowDetected();
    if (!window.ResizeObserver) {
      // We do not support the auto resize feature on legacy browsers. Fail silently instead.
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const _entry of entries) {
        this.setOverflowDetected();
      }
    });
    this.resizeObserver.observe(this.el.nativeElement);
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
    // Reset overflow detection when the window is resized. Widths will be recalculated after
    this.overflowDetected = false;
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
