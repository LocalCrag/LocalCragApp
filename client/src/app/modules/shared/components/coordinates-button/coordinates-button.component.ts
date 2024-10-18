import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {Coordinates} from '../../../../interfaces/coordinates.interface';
import {SplitButtonModule} from 'primeng/splitbutton';
import {MenuItem} from 'primeng/api';
import {ClipboardService} from '../../../../services/core/clipboard.service';
import {marker} from '@jsverse/transloco-keys-manager/marker';

@Component({
  selector: 'lc-coordinates-button',
  standalone: true,
  imports: [TranslocoDirective, SplitButtonModule],
  templateUrl: './coordinates-button.component.html',
  styleUrl: './coordinates-button.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CoordinatesButtonComponent {
  @Input() coordinates: Coordinates;

  public items: MenuItem[];

  constructor(
    private clipboardService: ClipboardService,
    private translocoService: TranslocoService,
  ) {
    this.items = [
      {
        label: this.translocoService.translate(
          marker('copyCoordinatesToClipboard'),
        ),
        icon: 'pi pi-copy',
        command: () => {
          this.clipboardService.copyTextToClipboard(
            `${this.coordinates.lat}, ${this.coordinates.lng}`,
          );
        },
      },
      {
        label: this.translocoService.translate(
          marker('openCoordinatesInGoogleMaps'),
        ),
        icon: 'pi pi-map',
        command: () => {
          this.openCoordinates();
        },
      },
    ];
  }

  openCoordinates() {
    window.open(
      `https://maps.google.com/?q=${this.coordinates.lat},${this.coordinates.lng}`,
    );
  }
}
