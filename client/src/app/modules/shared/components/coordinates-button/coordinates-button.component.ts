import {
  Component,
  Input,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Coordinates } from '../../../../interfaces/coordinates.interface';
import { MenuItem } from '../../models/menu-item';
import { ClipboardService } from '../../../../services/core/clipboard.service';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { LanguageService } from '../../../../services/core/language.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmButtonGroup } from '@spartan-ng/helm/button-group';
import {
  HlmDropdownMenu,
  HlmDropdownMenuItem,
  HlmDropdownMenuTrigger,
} from '@spartan-ng/helm/dropdown-menu';
import {
  lucideNameFromPrimeIcon,
  sharedLucideIcons,
} from '../../utils/prime-icon';

@Component({
  selector: 'lc-coordinates-button',
  imports: [
    TranslocoDirective,
    NgIcon,
    HlmButton,
    HlmButtonGroup,
    HlmDropdownMenu,
    HlmDropdownMenuItem,
    HlmDropdownMenuTrigger,
  ],
  providers: [provideIcons(sharedLucideIcons)],
  templateUrl: './coordinates-button.component.html',
  styleUrl: './coordinates-button.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
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

  iconName(icon?: string): string | null {
    return lucideNameFromPrimeIcon(icon);
  }

  runItem(item: MenuItem): void {
    item.command?.();
  }

  private buildItems() {
    this.items = [
      {
        label: this.translocoService.translate(
          marker('copyCoordinatesToClipboard'),
        ),
        icon: 'lucideCopy',
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
        icon: 'lucideMap',
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
