import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';

/** Minimal topo node needed for hierarchy breadcrumbs. */
export interface TopoHierarchyBreadcrumbNode {
  name: string;
  slug: string;
}

/**
 * Comma-separated clickable crag → sector → area breadcrumbs.
 * Skipped hierarchy layers (placeholder slugs) are hidden from display.
 */
@Component({
  selector: 'lc-topo-hierarchy-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './topo-hierarchy-breadcrumbs.component.html',
  styleUrl: './topo-hierarchy-breadcrumbs.component.scss',
})
export class TopoHierarchyBreadcrumbsComponent {
  @Input() crag: TopoHierarchyBreadcrumbNode | null | undefined;
  @Input() sector: TopoHierarchyBreadcrumbNode | null | undefined;
  @Input() area: TopoHierarchyBreadcrumbNode | null | undefined;
  /**
   * When true, segments render as spans (for use inside a parent <a>)
   * and clicks navigate without activating that parent link.
   */
  @Input() stopPropagation = false;

  protected readonly skippedSlug = environment.skippedSlug;

  private router = inject(Router);

  protected get cragLink(): string | null {
    if (!this.crag?.slug) {
      return null;
    }
    return `/topo/${this.crag.slug}`;
  }

  protected get sectorLink(): string | null {
    if (!this.crag?.slug || !this.sector?.slug) {
      return null;
    }
    return `/topo/${this.crag.slug}/${this.sector.slug}`;
  }

  protected get areaLink(): string | null {
    if (!this.crag?.slug || !this.sector?.slug || !this.area?.slug) {
      return null;
    }
    return `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}`;
  }

  protected get showCrag(): boolean {
    return (
      !!this.crag && this.crag.slug !== this.skippedSlug && !!this.cragLink
    );
  }

  protected get showSector(): boolean {
    return (
      !!this.sector &&
      this.sector.slug !== this.skippedSlug &&
      !!this.sectorLink
    );
  }

  protected get showArea(): boolean {
    return !!this.area && !!this.areaLink;
  }

  protected onNestedSegmentClick(event: MouseEvent, link: string | null): void {
    event.preventDefault();
    event.stopPropagation();
    if (link) {
      void this.router.navigateByUrl(link);
    }
  }
}
