import { Component, Input } from '@angular/core';
import { Tag } from '../../../../models/tag';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'lc-tag',
  standalone: true,
  imports: [TagModule],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
})
export class TagComponent {
  @Input() tag: Tag;
}
