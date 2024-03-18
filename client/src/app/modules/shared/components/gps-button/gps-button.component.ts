import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {GPS} from '../../../../interfaces/gps.interface';
import {SplitButtonModule} from 'primeng/splitbutton';
import {MenuItem} from 'primeng/api';
import {ClipboardService} from '../../../../services/core/clipboard.service';
import {marker} from '@ngneat/transloco-keys-manager/marker';

@Component({
  selector: 'lc-gps-button',
  standalone: true,
  imports: [
    TranslocoDirective,
    SplitButtonModule
  ],
  templateUrl: './gps-button.component.html',
  styleUrl: './gps-button.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class GpsButtonComponent {

  @Input() gps: GPS;

  public items: MenuItem[];

  constructor(private clipboardService: ClipboardService,
              private translocoService: TranslocoService) {
    this.items = [
      {
        label: this.translocoService.translate(marker('copyCoordinatesToClipboard')),
        icon: 'pi pi-copy',
        command: () => {
          this.clipboardService.copyTextToClipboard(`${this.gps.lat}, ${this.gps.lng}`);
        }
      },
      {
        label:  this.translocoService.translate(marker('openCoordinatesInGoogleMaps')),
        icon: 'pi pi-map',
        command: () => {
          this.openGPS();
        }
      },
    ];
  }

  openGPS() {
    window.open(`https://maps.google.com/?q=${this.gps.lat},${this.gps.lng}`)
  }



}
