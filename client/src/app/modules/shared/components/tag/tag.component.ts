import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { Tag } from '../../../../models/tag';
import { TagModule } from 'primeng/tag';
import { NgIf } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { RouterLink } from '@angular/router';
import { EntityLinkPipe } from '../../pipes/entity-link.pipe';
import { SearchableComponent } from '../../../core/searchable/searchable.component';
import { Searchable } from '../../../../models/searchable';

@Component({
  selector: 'lc-tag',
  imports: [
    TagModule,
    NgIf,
    AvatarModule,
    EntityLinkPipe,
    RouterLink,
    SearchableComponent,
  ],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TagComponent implements OnChanges {
  @Input() tag: Tag;

  public searchable: Searchable;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.tag) {
      this.searchable = Searchable.fromObject(this.tag.object);
    }
  }
}
