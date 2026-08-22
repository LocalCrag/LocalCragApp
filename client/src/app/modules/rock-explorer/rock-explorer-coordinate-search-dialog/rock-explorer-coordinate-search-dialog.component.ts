import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { parseCoordinatesInput } from '../../../utility/geo/parse-coordinates';
import { RockExplorerUiService } from '../rock-explorer-ui.service';

@Component({
  selector: 'lc-rock-explorer-coordinate-search-dialog',
  imports: [
    FormsModule,
    TranslocoDirective,
    ButtonModule,
    InputTextModule,
    InputGroup,
    InputGroupAddon,
    MessageModule,
  ],
  templateUrl: './rock-explorer-coordinate-search-dialog.component.html',
  styleUrl: './rock-explorer-coordinate-search-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RockExplorerCoordinateSearchDialogComponent implements AfterViewInit {
  @ViewChild('queryInput') private queryInput?: ElementRef<HTMLInputElement>;

  query = '';
  errorMessage = '';

  private ref = inject(DynamicDialogRef);
  private transloco = inject(TranslocoService);
  private ui = inject(RockExplorerUiService);

  ngAfterViewInit(): void {
    queueMicrotask(() => this.queryInput?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape', ['$event'])
  onDocumentEscape(event: Event): void {
    event.preventDefault();
    this.close();
  }

  goToCoordinates(): void {
    const parsed = parseCoordinatesInput(this.query);
    if (!parsed) {
      this.errorMessage = this.transloco.translate(
        marker('rockExplorer.coordinateSearchInvalid'),
      );
      return;
    }
    this.ui.dispatch({
      type: 'focusCoordinates',
      coordinates: parsed,
      transientMarker: true,
    });
    this.close();
  }

  close(): void {
    this.ref.close();
  }
}
