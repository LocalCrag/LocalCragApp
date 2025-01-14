import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  QueryList,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { MenuItem, PrimeTemplate } from 'primeng/api';
import { NgClass, NgIf, NgTemplateOutlet } from '@angular/common';
import { HeaderMenuSubComponent } from './header-menu-sub.component';
import { ProcessedMenuItem } from './processed-menu-item';
import { HeaderMenuService } from './header-menu.service';
import { MOBILE_BREAKPOINT_HEADER_MENU } from '../../../../utility/misc/breakpoints';
import { BarsIcon } from 'primeng/icons/bars';

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
  implements AfterContentInit, OnChanges, OnInit, AfterViewInit
{
  @Input() model: MenuItem[];

  @ContentChildren(PrimeTemplate) templates:
    | QueryList<PrimeTemplate>
    | undefined;

  public processedModel: ProcessedMenuItem[];
  public startTemplate: TemplateRef<any> | undefined;
  public endTemplate: TemplateRef<any> | undefined;
  public isMobile = false;
  public mobileExpanded = false;
  public overflowDetected = false;

  private resizeObserver!: ResizeObserver;

  constructor(
    private headerMenuService: HeaderMenuService,
    private cdr: ChangeDetectorRef,
    private el: ElementRef,
  ) {}

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

  toggleMobileMenu(event) {
    event.stopPropagation();
    this.mobileExpanded =
      (this.isMobile || this.overflowDetected) && !this.mobileExpanded;
    this.cdr.detectChanges();
  }
}
