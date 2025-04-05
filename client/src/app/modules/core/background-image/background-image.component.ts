import { Component, ElementRef, OnInit } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  selectAuthBgImage,
  selectMainBgImage,
} from '../../../ngrx/selectors/instance-settings.selectors';

export enum StaticBackgroundImages {
  DEFAULT,
  AUTH,
  NOT_FOUND,
}

export enum StaticBackgroundImageDefaults {
  DEFAULT = 'assets/bg.jpeg',
  AUTH = 'assets/login-bg.jpeg',
  NOT_FOUND = 'assets/404.jpeg',
}

@Component({
  selector: 'lc-background-image',
  imports: [],
  templateUrl: './background-image.component.html',
  styleUrl: './background-image.component.scss',
})
export class BackgroundImageComponent implements OnInit {
  constructor(
    private el: ElementRef,
    private store: Store,
    private router: Router,
  ) {
    this.setBackgroundImage(StaticBackgroundImages.DEFAULT);
  }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof ActivationEnd) {
        const data = event.snapshot.data;
        if ('backgroundImagePath' in data) {
          this.setBackgroundImage(data.backgroundImagePath);
        }
      }
    });
  }

  setBackgroundImage(type: StaticBackgroundImages) {
    switch (type) {
      case StaticBackgroundImages.DEFAULT:
        this.store.select(selectMainBgImage).subscribe((bgImage) => {
          const path = bgImage
            ? bgImage.thumbnailXL
            : StaticBackgroundImageDefaults.DEFAULT;
          this.el.nativeElement.style.backgroundImage = `url(${path})`;
        });
        break;
      case StaticBackgroundImages.AUTH:
        this.store.select(selectAuthBgImage).subscribe((bgImage) => {
          const path = bgImage
            ? bgImage.thumbnailXL
            : StaticBackgroundImageDefaults.AUTH;
          this.el.nativeElement.style.backgroundImage = `url(${path})`;
        });
        break;
      case StaticBackgroundImages.NOT_FOUND:
        this.el.nativeElement.style.backgroundImage = `url(${StaticBackgroundImageDefaults.NOT_FOUND})`;
        break;
    }
  }
}
