import { Component, OnInit, ViewChild } from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { LinePath } from '../../../models/line-path';
import { LinePathsService } from '../../../services/crud/line-paths.service';
import { LinesService } from '../../../services/crud/lines.service';
import { Line } from '../../../models/line';
import { TopoImagesService } from '../../../services/crud/topo-images.service';
import { forkJoin } from 'rxjs';
import { LinePathEditorComponent } from '../line-path-editor/line-path-editor.component';
import { Title } from '@angular/platform-browser';
import {
  TRANSLOCO_SCOPE,
  TranslocoDirective,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { ScalesService } from '../../../services/crud/scales.service';
import { Card } from 'primeng/card';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { Select } from 'primeng/select';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { GymModeDirective } from '../../shared/directives/gym-mode.directive';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { Button } from 'primeng/button';

/**
 * Form for line paths.
 */
@Component({
  selector: 'lc-line-path-form',
  templateUrl: './line-path-form.component.html',
  styleUrls: ['./line-path-form.component.scss'],
  imports: [
    TranslocoDirective,
    Card,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    Select,
    FormControlDirective,
    GymModeDirective,
    LineGradePipe,
    IfErrorDirective,
    LinePathEditorComponent,
    Button,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'linePath' }],
})
export class LinePathFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild(LinePathEditorComponent) linePathEditor: LinePathEditorComponent;

  public linePathForm: FormGroup;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public linePath: LinePath;
  public lines: Line[];

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;
  private topoImageId: string;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private translocoService: TranslocoService,
    private linesService: LinesService,
    private topoImagesService: TopoImagesService,
    private linePathsService: LinePathsService,
    protected scalesService: ScalesService,
  ) {}

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    this.topoImageId = this.route.snapshot.paramMap.get('topo-image-id');
    this.refreshData();
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('addLinePathBrowserTitle'))} - ${instanceName}`,
      );
    });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    this.buildForm();
    this.loadingState = LoadingState.INITIAL_LOADING;
    forkJoin([
      this.linesService.getLinesForLineEditor(this.areaSlug),
      this.topoImagesService.getTopoImage(this.topoImageId),
    ]).subscribe(([lines, topoImage]) => {
      this.lines = lines;
      this.loadingState = LoadingState.DEFAULT;
      const disabledLineIds: { [lineId: string]: any } = {};
      topoImage.linePaths.map((linePath) => {
        disabledLineIds[linePath.line.id] = linePath.line;
      });
      this.lines.map((line) => {
        line.disabled = line.id in disabledLineIds;
      });
    });
  }

  /**
   * Builds the area form.
   */
  private buildForm() {
    this.linePathForm = this.fb.group({
      line: [null, [Validators.required]],
      path: [[], [Validators.required, Validators.minLength(4)]],
    });
  }

  /**
   * Cancels the form.
   */
  leaveEditor() {
    this.router.navigate([
      '/topo',
      this.cragSlug,
      this.sectorSlug,
      this.areaSlug,
      'topo-images',
    ]);
  }

  /**
   * Saves the topo image and navigates to the topo image list.
   */
  public saveLinePath() {
    if (this.linePathForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const linePath = new LinePath();
      linePath.line = this.linePathForm.get('line').value;
      linePath.path = this.linePathForm.get('path').value;
      this.linePathsService
        .addLinePath(linePath, this.topoImageId)
        .subscribe(() => {
          this.store.dispatch(toastNotification('LINE_PATH_ADDED'));
          // this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'topo-images']);
          this.loadingState = LoadingState.DEFAULT;
          this.refreshData();
          this.linePathEditor.refreshData(true);
        });
    } else {
      this.formDirective.markAsTouched();
    }
  }
}
