import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'lc-draft-tag',
  imports: [TranslocoDirective, TagModule],
  templateUrl: './draft-tag.component.html',
  styleUrl: './draft-tag.component.scss',
})
export class DraftTagComponent {}
