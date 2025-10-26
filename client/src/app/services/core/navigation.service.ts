import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private router = inject(Router);
  private previousUrl: string = null;
  private currentUrl: string = null;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
      }
    });
  }

  public getPreviousUrl(): string {
    return this.previousUrl;
  }
}
