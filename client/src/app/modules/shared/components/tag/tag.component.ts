import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ObjectType, Tag } from '../../../../models/tag';
import { TagModule } from 'primeng/tag';
import { NgIf } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { RouterLink } from '@angular/router';
import { EntityLinkPipe } from '../../pipes/entity-link.pipe';

@Component({
  selector: 'lc-tag',
  standalone: true,
  imports: [TagModule, NgIf, AvatarModule, EntityLinkPipe, RouterLink],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TagComponent {
  @Input() tag: Tag;

  public objectTypes = ObjectType;
}
