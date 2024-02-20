import {Component, ElementRef, OnInit} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, ActivationStart, Router} from '@angular/router';

export enum StaticBackgroundImages {
  DEFAULT = 'assets/bg.jpeg',
  AUTH = 'assets/login-bg.jpeg',
  NOT_FOUND = 'assets/404.jpg',
}

/**
 * Component that shows a cover size background image. The image that is displayed is set via route data.
 */
@Component({
  selector: 'lc-background-image',
  standalone: true,
  imports: [],
  templateUrl: './background-image.component.html',
  styleUrl: './background-image.component.scss'
})
export class BackgroundImageComponent implements OnInit {

  constructor(private el: ElementRef,
              private router: Router) {
    this.setBackgroundImage(StaticBackgroundImages.DEFAULT);
  }

  /**
   * Subscribe to route data changes and set a new background image if `backgroundImagePath` is given.
   */
  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof ActivationStart) {
        const data = event.snapshot.data;
        if ('backgroundImagePath' in data) {
          this.setBackgroundImage(data.backgroundImagePath);
        }
      }
    })
  }

  /**
   * Set the background image on the component.
   * @param path Path of the background image.
   */
  setBackgroundImage(path: string) {
    this.el.nativeElement.style.backgroundImage = `url(${path})`;
  }

}
