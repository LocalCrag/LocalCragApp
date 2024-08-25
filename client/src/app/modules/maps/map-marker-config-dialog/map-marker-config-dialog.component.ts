import {Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {InputTextModule} from 'primeng/inputtext';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@ngneat/transloco';
import {LoadingState} from '../../../enums/loading-state';
import {Editor, EditorModule} from 'primeng/editor';
import {GpsComponent} from '../../shared/forms/controls/gps/gps.component';
import {ColorPickerModule} from 'primeng/colorpicker';
import {DropdownModule} from 'primeng/dropdown';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {MAP_MARKER_TYPES} from '../../../enums/map-marker-type';
import {FormDirective} from '../../shared/forms/form.directive';
import {Crag} from '../../../models/crag';
import {MapMarker} from '../../../models/map-marker';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {UploadService} from '../../../services/crud/upload.service';
import {CragsService} from '../../../services/crud/crags.service';
import {ConfirmationService} from 'primeng/api';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {NgIf} from '@angular/common';

@Component({
  selector: 'lc-map-marker-config-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SharedModule,
    InputTextModule,
    TranslocoDirective,
    EditorModule,
    GpsComponent,
    ColorPickerModule,
    DropdownModule,
    ToggleButtonModule,
    TranslocoPipe,
    DialogModule,
    ButtonModule,
    NgIf,
  ],
  templateUrl: './map-marker-config-dialog.component.html',
  styleUrl: './map-marker-config-dialog.component.scss'
})
export class MapMarkerConfigDialogComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  @Output() newMarker = new EventEmitter<MapMarker>();

  public types = MAP_MARKER_TYPES;
  public mapMarkerForm: FormGroup;
  public isOpen = false;
  public marker: MapMarker;

  constructor(private fb: FormBuilder,
              private store: Store,
              private route: ActivatedRoute,
              private router: Router,
              private title: Title,
              private cragsService: CragsService,
              private translocoService: TranslocoService,
              private confirmationService: ConfirmationService) {
  }

  ngOnInit() {
    this.buildForm();
  }

  private buildForm() {
    this.mapMarkerForm = this.fb.group({
      name: ['', [Validators.maxLength(120)]],
      description: [''],
      gps: [null],
      type: [null, [Validators.required]], // todo choose correct default
    });
  }

  private setFormValue() {
    this.mapMarkerForm.enable();
    this.mapMarkerForm.patchValue({
      name: this.marker.name,
      description: this.marker.description,
      gps: this.marker.gps,
      type: this.marker.type
    });
  }

  public open(marker?: MapMarker) {
    if(!marker){
      marker = new MapMarker();
    }
    this.marker = marker;
    this.setFormValue();
    this.isOpen = true;
  }

  public close() {
    this.isOpen = false;
  }

  public save() {
    if (this.mapMarkerForm.valid) {
      this.marker.name = this.mapMarkerForm.get('name').value;
      this.marker.description = this.mapMarkerForm.get('description').value;
      this.marker.gps = this.mapMarkerForm.get('gps').value;
      this.marker.type = this.mapMarkerForm.get('type').value;
      if(!this.marker.id){
        this.newMarker.emit(this.marker);
      }
      this.isOpen = false;
    } else {
      this.mapMarkerForm.markAllAsTouched();
    }
  }

}
