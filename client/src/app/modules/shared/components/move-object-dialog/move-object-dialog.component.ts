import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Sector } from '../../../../models/sector';
import { Area } from '../../../../models/area';
import { Line } from '../../../../models/line';
import { TopoImage } from '../../../../models/topo-image';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { SearchService } from '../../../../services/crud/search.service';
import { Searchable } from '../../../../models/searchable';
import { ObjectType } from '../../../../models/object';
import { SectorsService } from '../../../../services/crud/sectors.service';
import { AreasService } from '../../../../services/crud/areas.service';
import { LinesService } from '../../../../services/crud/lines.service';
import { TopoImagesService } from '../../../../services/crud/topo-images.service';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../../ngrx/actions/notifications.actions';
import { FormDirective } from '../../forms/form.directive';
import { ControlGroupDirective } from '../../forms/control-group.directive';
import { FormControlDirective } from '../../forms/form-control.directive';
import { IfErrorDirective } from '../../forms/if-error.directive';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Message } from 'primeng/message';

@Component({
  selector: 'lc-move-object-dialog',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    TranslocoDirective,
    AutoCompleteModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    Message,
  ],
  templateUrl: './move-object-dialog.component.html',
  styleUrl: './move-object-dialog.component.scss',
})
export class MoveObjectDialogComponent {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @Output() objectMoved = new EventEmitter<Sector | Area | Line | TopoImage>();
  @Input() hasUnsavedChanges = false;

  public isOpen = false;
  public loading = false;
  public submitted = false;
  public form: FormGroup;
  public suggestions: Searchable[] = [];
  public objectToMove: Sector | Area | Line | TopoImage;

  private currentParentId: string | null = null;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private searchService = inject(SearchService);
  private sectorsService = inject(SectorsService);
  private areasService = inject(AreasService);
  private linesService = inject(LinesService);
  private topoImagesService = inject(TopoImagesService);

  get objectToMoveIsTopoImage(): boolean {
    return this.objectToMove instanceof TopoImage;
  }

  get targetObjectType(): ObjectType {
    if (this.objectToMove instanceof Sector) return ObjectType.Crag;
    if (this.objectToMove instanceof Area) return ObjectType.Sector;
    return ObjectType.Area; // Line or TopoImage
  }

  get titleKey(): string {
    if (this.objectToMove instanceof Sector)
      return marker('moveObjectDialog.titleCrag');
    if (this.objectToMove instanceof Area)
      return marker('moveObjectDialog.titleSector');
    return marker('moveObjectDialog.titleArea');
  }

  get labelKey(): string {
    if (this.objectToMove instanceof Sector)
      return marker('moveObjectDialog.targetLabelCrag');
    if (this.objectToMove instanceof Area)
      return marker('moveObjectDialog.targetLabelSector');
    return marker('moveObjectDialog.targetLabelArea');
  }

  get placeholderKey(): string {
    if (this.objectToMove instanceof Sector)
      return marker('moveObjectDialog.targetPlaceholderCrag');
    if (this.objectToMove instanceof Area)
      return marker('moveObjectDialog.targetPlaceholderSector');
    return marker('moveObjectDialog.targetPlaceholderArea');
  }

  public open(
    objectToMove: Sector | Area | Line | TopoImage,
    currentParentId: string,
  ): void {
    this.objectToMove = objectToMove;
    this.currentParentId = currentParentId;
    this.submitted = false;
    this.suggestions = [];
    this.form = this.fb.group({
      target: [null, Validators.required],
    });
    this.isOpen = true;
  }

  public close() {
    this.isOpen = false;
    this.form = null;
  }

  searchSuggestions(event: AutoCompleteCompleteEvent) {
    const query = event.query?.trim();
    if (!query) {
      this.suggestions = [];
      return;
    }
    this.searchService
      .search(query, this.targetObjectType)
      .subscribe((results) => {
        this.suggestions = this.currentParentId
          ? results.filter((s) => s.id !== this.currentParentId)
          : results;
      });
  }

  public submit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.formDirective.markAsTouched();
      return;
    }
    const target: Searchable = this.form.get('target').value;
    this.loading = true;

    let moveObservable;
    if (this.objectToMove instanceof Sector) {
      moveObservable = this.sectorsService.moveSector(
        this.objectToMove.slug,
        target.id,
      );
    } else if (this.objectToMove instanceof Area) {
      moveObservable = this.areasService.moveArea(
        this.objectToMove.slug,
        target.id,
      );
    } else if (this.objectToMove instanceof Line) {
      moveObservable = this.linesService.moveLine(
        this.objectToMove.slug,
        target.id,
      );
    } else {
      moveObservable = this.topoImagesService.moveTopImage(
        (this.objectToMove as TopoImage).id,
        target.id,
      );
    }

    moveObservable.subscribe({
      next: (movedObject) => {
        this.store.dispatch(toastNotification('OBJECT_MOVED'));
        this.loading = false;
        this.close();
        this.objectMoved.emit(movedObject);
      },
      error: () => {
        this.store.dispatch(toastNotification('OBJECT_MOVE_ERROR'));
        this.loading = false;
      },
    });
  }
}
