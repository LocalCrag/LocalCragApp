import {Component, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'lc-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FooterComponent {

  public currentYear = (new Date()).getFullYear();

}
