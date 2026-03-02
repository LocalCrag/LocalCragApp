import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Coordinates } from '../../../../interfaces/coordinates.interface';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem } from 'primeng/api';
import { ClipboardService } from '../../../../services/core/clipboard.service';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { LanguageService } from '../../../../services/core/language.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'lc-coordinates-button',
  imports: [TranslocoDirective, SplitButtonModule],
  templateUrl: './coordinates-button.component.html',
  styleUrl: './coordinates-button.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CoordinatesButtonComponent {
  @Input() coordinates: Coordinates;

  public items: MenuItem[];

  private clipboardService = inject(ClipboardService);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.buildItems();
    this.languageService.renderedLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rendered) => {
        if (!rendered) return;
        this.buildItems();
      });
  }

  private buildItems() {
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
