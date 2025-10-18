import {
  Directive,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Signal,
  computed,
  signal,
  inject,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';

@Directive({
  selector: '[lcSetActiveTab]',
  exportAs: 'lcSetActiveTab',
})
export class SetActiveTabDirective implements OnInit, OnDestroy, OnChanges {
  @Input() items: MenuItem[];

  private routerSubscription: Subscription;

  // Signal to store active tab index
  private activeTabIndexSignal = signal<number>(0);
  public activeTabIndex: Signal<number> = computed(() =>
    this.activeTabIndexSignal(),
  );

  private router = inject(Router);

  ngOnInit() {
    this.updateActiveTabIndex();
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveTabIndex();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.items) {
      this.updateActiveTabIndex();
    }
  }

  private updateActiveTabIndex() {
    const activeItem = this.items.findIndex((item) =>
      this.router.isActive(item.routerLink, {
        paths: item.routerLinkActiveOptions?.exact ? 'exact' : 'subset',
        fragment: 'ignored',
        matrixParams: 'ignored',
        queryParams: 'ignored',
      }),
    );

    this.activeTabIndexSignal.set(activeItem !== -1 ? activeItem : 0);
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }
}
