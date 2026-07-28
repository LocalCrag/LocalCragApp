import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Message } from 'primeng/message';
import { Textarea } from 'primeng/textarea';
import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import {
  RockExplorerParkingSite,
  RockExplorerPath,
  cloneParkingSites,
  clonePaths,
  newParkingSiteId,
  newPathId,
  parkingSiteCoordinates,
} from '../../../models/rock-explorer-misc';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { CoordinatesComponent } from '../../shared/forms/controls/coordinates/coordinates.component';

@Component({
  selector: 'lc-rock-explorer-misc',
  imports: [
    FormsModule,
    Button,
    DialogModule,
    InputText,
    Menu,
    Message,
    Textarea,
    CoordinatesComponent,
    TranslocoDirective,
  ],
  templateUrl: './rock-explorer-misc.component.html',
  styleUrl: './rock-explorer-misc.component.scss',
})
export class RockExplorerMiscComponent implements OnChanges {
  @Input({ required: true }) object!: RockExplorerFeature;
  @Output() editModeChange = new EventEmitter<boolean>();
  @Output() mapPickChange = new EventEmitter<boolean>();
  @Output() pathDrawChange = new EventEmitter<boolean>();
  @Output() previewChange = new EventEmitter<void>();
  @Output() saved = new EventEmitter<RockExplorerFeature>();
  @Output() focusCoordinates = new EventEmitter<Coordinates>();

  public editMode = false;
  public saving = false;
  public parkingSites: RockExplorerParkingSite[] = [];
  public paths: RockExplorerPath[] = [];
  public pickingParkingId: string | null = null;
  public drawingPathId: string | null = null;
  public pathDraftVertices: Position[] = [];
  /** Vertex selected for deletion while editing a path. */
  public selectedPathVertexIndex: number | null = null;
  public parkingMenuItems: MenuItem[] = [];
  public coordinatesDialogVisible = false;
  public coordinatesDialogValue: Coordinates | null = null;

  private parkingSnapshot: RockExplorerParkingSite[] = [];
  private pathsSnapshot: RockExplorerPath[] = [];
  private coordinatesDialogParkingId: string | null = null;
  private destroyRef = inject(DestroyRef);
  private rockExplorerService = inject(RockExplorerService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private transloco = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['object'] || !this.object) {
      return;
    }
    this.syncFromObject();
    if (this.editMode) {
      this.cancelMapInteractions();
      this.setEditMode(false);
    }
  }

  setEditMode(enabled: boolean): void {
    this.editMode = enabled;
    if (enabled) {
      this.snapshotEditState();
    } else {
      this.cancelMapInteractions();
      this.closeCoordinatesDialog();
    }
    this.editModeChange.emit(enabled);
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.parkingSites = cloneParkingSites(this.parkingSnapshot);
    this.paths = clonePaths(this.pathsSnapshot);
    this.setEditMode(false);
  }

  saveAll(): void {
    if (this.saving || !this.object?.id) {
      return;
    }
    if (this.drawingPathId) {
      this.finishPathDraw();
      if (this.drawingPathId) {
        this.messageService.add({
          severity: 'warn',
          summary: this.transloco.translate(
            marker('rockExplorer.pathNeedsVertices'),
          ),
        });
        return;
      }
    }
    this.cancelMapPick();

    const incompleteParking = this.parkingSites.some(
      (site) => site.lat == null || site.lng == null,
    );
    if (incompleteParking) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.parkingNeedsCoordinates'),
        ),
      });
      return;
    }
    const incompletePaths = this.paths.some(
      (path) => (path.geometry?.coordinates?.length ?? 0) < 2,
    );
    if (incompletePaths) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.pathNeedsVertices'),
        ),
      });
      return;
    }

    this.saving = true;
    this.cdr.detectChanges();

    const payload = RockExplorerFeature.deserialize(
      RockExplorerFeature.serialize(this.object),
    );
    payload.id = this.object.id;
    payload.parkingSites = cloneParkingSites(this.parkingSites).map((site) => ({
      ...site,
      lat: site.lat as number,
      lng: site.lng as number,
    }));
    payload.paths = clonePaths(this.paths);

    this.rockExplorerService
      .updateFeature(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.object.parkingSites = cloneParkingSites(updated.parkingSites);
          this.object.paths = clonePaths(updated.paths);
          this.parkingSites = cloneParkingSites(updated.parkingSites);
          this.paths = clonePaths(updated.paths);
          this.saving = false;
          this.setEditMode(false);
          this.saved.emit(updated);
          this.previewChange.emit();
          this.cdr.detectChanges();
        },
        error: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.miscSaveError'),
            ),
          });
          this.cdr.detectChanges();
        },
      });
  }

  addParkingSite(): void {
    this.parkingSites = [
      ...this.parkingSites,
      {
        id: newParkingSiteId(),
        lat: null,
        lng: null,
        title: null,
        description: null,
      },
    ];
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  parkingHasCoordinates(site: RockExplorerParkingSite): boolean {
    return site.lat != null && site.lng != null;
  }

  setParkingCoordinates(
    site: RockExplorerParkingSite,
    coordinates: Coordinates | null,
    silent = false,
  ): void {
    if (!coordinates) {
      return;
    }
    site.lat = coordinates.lat;
    site.lng = coordinates.lng;
    if (!silent) {
      this.previewChange.emit();
      this.cdr.detectChanges();
    }
  }

  moveParkingSite(id: string, lat: number, lng: number, silent = false): void {
    const site = this.parkingSites.find((s) => s.id === id);
    if (!site) {
      return;
    }
    this.setParkingCoordinates(site, { lat, lng }, silent);
  }

  onParkingFieldChange(): void {
    this.previewChange.emit();
  }

  confirmDeleteParking(event: Event, site: RockExplorerParkingSite): void {
    this.confirmationService.confirm({
      target: event.currentTarget ?? event.target,
      message: this.transloco.translate(
        marker('rockExplorer.parkingDeleteConfirm'),
      ),
      acceptLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteYes'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteNo'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.parkingSites = this.parkingSites.filter((s) => s.id !== site.id);
        if (this.pickingParkingId === site.id) {
          this.cancelMapPick();
        }
        this.previewChange.emit();
        this.cdr.detectChanges();
      },
    });
  }

  openParkingMenu(
    event: Event,
    site: RockExplorerParkingSite,
    menu: Menu,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this.parkingMenuItems = this.buildParkingMenuItems(site);
    menu.toggle(event);
  }

  parkingButtonSeverity(
    site: RockExplorerParkingSite,
  ): 'primary' | 'secondary' | 'danger' {
    if (this.pickingParkingId === site.id) {
      return 'danger';
    }
    return this.parkingHasCoordinates(site) ? 'primary' : 'secondary';
  }

  toggleMapPick(site: RockExplorerParkingSite): void {
    if (this.saving) {
      return;
    }
    if (this.pickingParkingId === site.id) {
      this.cancelMapPick();
      return;
    }
    this.cancelPathDraw();
    this.pickingParkingId = site.id;
    this.mapPickChange.emit(true);
  }

  cancelMapPick(): void {
    if (!this.pickingParkingId) {
      return;
    }
    this.pickingParkingId = null;
    this.mapPickChange.emit(false);
  }

  applyMapPick(lat: number, lng: number): void {
    const site = this.parkingSites.find((s) => s.id === this.pickingParkingId);
    if (!site) {
      this.cancelMapPick();
      return;
    }
    this.setParkingCoordinates(site, { lat, lng });
    this.cancelMapPick();
  }

  openCoordinatesDialog(site: RockExplorerParkingSite): void {
    this.coordinatesDialogParkingId = site.id;
    this.coordinatesDialogValue = parkingSiteCoordinates(site);
    this.coordinatesDialogVisible = true;
  }

  closeCoordinatesDialog(): void {
    this.coordinatesDialogVisible = false;
    this.coordinatesDialogParkingId = null;
    this.coordinatesDialogValue = null;
  }

  applyCoordinatesDialog(): void {
    const site = this.parkingSites.find(
      (s) => s.id === this.coordinatesDialogParkingId,
    );
    if (site && this.coordinatesDialogValue) {
      this.setParkingCoordinates(site, this.coordinatesDialogValue);
    }
    this.closeCoordinatesDialog();
  }

  focusParking(site: RockExplorerParkingSite): void {
    const coords = parkingSiteCoordinates(site);
    if (!coords) {
      return;
    }
    this.focusCoordinates.emit(coords);
  }

  addPath(): void {
    this.cancelMapPick();
    this.cancelPathDraw();
    const path: RockExplorerPath = {
      id: newPathId(),
      title: null,
      description: null,
      geometry: { type: 'LineString', coordinates: [] },
    };
    this.paths = [...this.paths, path];
    this.startPathDraw(path);
    this.cdr.detectChanges();
  }

  pathHasGeometry(path: RockExplorerPath): boolean {
    return (path.geometry?.coordinates?.length ?? 0) >= 2;
  }

  startPathDraw(path: RockExplorerPath): void {
    if (this.saving) {
      return;
    }
    this.cancelMapPick();
    this.drawingPathId = path.id;
    this.selectedPathVertexIndex = null;
    this.pathDraftVertices = (path.geometry?.coordinates ?? []).map((c) => [
      c[0],
      c[1],
    ]);
    this.pathDrawChange.emit(true);
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  cancelPathDraw(): void {
    if (!this.drawingPathId) {
      return;
    }
    const draftId = this.drawingPathId;
    this.drawingPathId = null;
    this.pathDraftVertices = [];
    this.selectedPathVertexIndex = null;
    this.pathDrawChange.emit(false);
    const path = this.paths.find((p) => p.id === draftId);
    if (path && !this.pathHasGeometry(path)) {
      this.paths = this.paths.filter((p) => p.id !== draftId);
    }
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  finishPathDraw(): void {
    if (!this.drawingPathId || this.pathDraftVertices.length < 2) {
      return;
    }
    const path = this.paths.find((p) => p.id === this.drawingPathId);
    if (!path) {
      this.cancelPathDraw();
      return;
    }
    path.geometry = {
      type: 'LineString',
      coordinates: this.pathDraftVertices.map(
        (c) => [c[0], c[1]] as [number, number],
      ),
    };
    this.drawingPathId = null;
    this.pathDraftVertices = [];
    this.selectedPathVertexIndex = null;
    this.pathDrawChange.emit(false);
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  undoPathVertex(): void {
    if (this.pathDraftVertices.length === 0) {
      return;
    }
    this.pathDraftVertices = this.pathDraftVertices.slice(0, -1);
    if (
      this.selectedPathVertexIndex != null &&
      this.selectedPathVertexIndex >= this.pathDraftVertices.length
    ) {
      this.selectedPathVertexIndex = null;
    }
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  applyPathVertex(lng: number, lat: number): void {
    if (!this.drawingPathId) {
      return;
    }
    this.selectedPathVertexIndex = null;
    this.pathDraftVertices = [...this.pathDraftVertices, [lng, lat]];
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  movePathVertex(
    index: number,
    lng: number,
    lat: number,
    silent = false,
  ): void {
    if (
      !this.drawingPathId ||
      index < 0 ||
      index >= this.pathDraftVertices.length
    ) {
      return;
    }
    // Mutate in place for smooth dragging (avoid array realloc + CD each frame).
    this.pathDraftVertices[index][0] = lng;
    this.pathDraftVertices[index][1] = lat;
    if (!silent) {
      this.previewChange.emit();
      this.cdr.detectChanges();
    }
  }

  selectPathVertex(index: number | null): void {
    if (
      index != null &&
      (index < 0 || index >= this.pathDraftVertices.length)
    ) {
      return;
    }
    this.selectedPathVertexIndex = index;
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  deletePathVertex(index?: number): void {
    const target = index ?? this.selectedPathVertexIndex;
    if (
      target == null ||
      target < 0 ||
      target >= this.pathDraftVertices.length
    ) {
      return;
    }
    this.pathDraftVertices = this.pathDraftVertices.filter(
      (_, i) => i !== target,
    );
    this.selectedPathVertexIndex = null;
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  clearPathGeometry(path: RockExplorerPath): void {
    path.geometry = { type: 'LineString', coordinates: [] };
    if (this.drawingPathId === path.id) {
      this.pathDraftVertices = [];
    }
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  confirmDeletePath(event: Event, path: RockExplorerPath): void {
    this.confirmationService.confirm({
      target: event.currentTarget ?? event.target,
      message: this.transloco.translate(
        marker('rockExplorer.pathDeleteConfirm'),
      ),
      acceptLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteYes'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteNo'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.drawingPathId === path.id) {
          this.drawingPathId = null;
          this.pathDraftVertices = [];
          this.pathDrawChange.emit(false);
        }
        this.paths = this.paths.filter((p) => p.id !== path.id);
        this.previewChange.emit();
        this.cdr.detectChanges();
      },
    });
  }

  focusPath(path: RockExplorerPath): void {
    const coords = path.geometry?.coordinates;
    if (!coords?.length) {
      return;
    }
    const mid = coords[Math.floor(coords.length / 2)];
    this.focusCoordinates.emit({ lat: mid[1], lng: mid[0] });
  }

  getParkingMapFeatures(): Feature<Geometry>[] {
    return this.parkingSites
      .filter((site) => this.parkingHasCoordinates(site))
      .map((site) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [site.lng as number, site.lat as number],
        },
        properties: {
          id: site.id,
          title: site.title,
          description: site.description,
          type: 'PARKING',
        },
      }));
  }

  getPathMapFeatures(): Feature<Geometry>[] {
    return this.paths
      .filter(
        (path) => this.pathHasGeometry(path) && path.id !== this.drawingPathId,
      )
      .map((path) => ({
        type: 'Feature' as const,
        geometry: path.geometry,
        properties: {
          id: path.id,
          title: path.title,
          description: path.description,
        },
      }));
  }

  getPathDraftCollection(): FeatureCollection<Geometry> {
    const features: Feature<Geometry>[] = [];
    if (this.pathDraftVertices.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: this.pathDraftVertices,
        },
        properties: { draft: true },
      });
    }
    this.pathDraftVertices.forEach((coord, index) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coord },
        properties: {
          draft: true,
          vertexIndex: index,
          selected: this.selectedPathVertexIndex === index,
        },
      });
    });
    return { type: 'FeatureCollection', features };
  }

  private syncFromObject(): void {
    this.parkingSites = cloneParkingSites(this.object.parkingSites);
    this.paths = clonePaths(this.object.paths);
    this.previewChange.emit();
    this.cdr.detectChanges();
  }

  private snapshotEditState(): void {
    this.parkingSnapshot = cloneParkingSites(this.parkingSites);
    this.pathsSnapshot = clonePaths(this.paths);
  }

  private cancelMapInteractions(): void {
    this.cancelMapPick();
    this.cancelPathDraw();
  }

  private buildParkingMenuItems(site: RockExplorerParkingSite): MenuItem[] {
    return [
      {
        label: this.transloco.translate(
          marker('rockExplorer.parkingShowOnMap'),
        ),
        icon: 'pi pi-eye',
        disabled: !this.parkingHasCoordinates(site),
        command: () => this.focusParking(site),
      },
      {
        label: this.transloco.translate(
          marker('rockExplorer.parkingPickOnMap'),
        ),
        icon: 'pi pi-map-marker',
        command: () => this.toggleMapPick(site),
      },
      {
        label: this.transloco.translate(
          marker('rockExplorer.parkingEnterCoordinates'),
        ),
        icon: 'pi pi-pencil',
        command: () => this.openCoordinatesDialog(site),
      },
    ];
  }
}
