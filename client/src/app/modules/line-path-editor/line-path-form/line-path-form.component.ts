import {Component, ViewChild} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {LinePath} from '../../../models/line-path';
import {LinePathsService} from '../../../services/crud/line-paths.service';
import {LinesService} from '../../../services/crud/lines.service';
import {Line} from '../../../models/line';
import {TopoImagesService} from '../../../services/crud/topo-images.service';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'lc-line-path-form',
  templateUrl: './line-path-form.component.html',
  styleUrls: ['./line-path-form.component.scss']
})
export class LinePathFormComponent {

  @ViewChild(FormDirective) formDirective: FormDirective;

  public linePathForm: FormGroup;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public linePath: LinePath;
  public lines: Line[];

  private cragSlug: string;
  private sectorSlug: string;
  private areaSlug: string;
  private topoImageId: string;

  constructor(private fb: FormBuilder,
              private store: Store,
              private route: ActivatedRoute,
              private router: Router,
              private linesService: LinesService,
              private topoImagesService: TopoImagesService,
              private linePathsService: LinePathsService) {
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.loadingState = LoadingState.INITIAL_LOADING;
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.snapshot.paramMap.get('area-slug');
    this.topoImageId = this.route.snapshot.paramMap.get('topo-image-id');
    forkJoin([
      this.linesService.getLines(this.areaSlug),
      this.topoImagesService.getTopoImage(this.topoImageId)
    ]).subscribe(([lines, topoImage])=>{
      this.lines = lines;
      this.loadingState = LoadingState.DEFAULT;
      const disabledLineIds: {[lineId: string]: any} = {};
      topoImage.linePaths.map(linePath => {
        disabledLineIds[linePath.line.id] = linePath.line;
      });
      this.lines.map(line=>{
        line.disabled = line.id in disabledLineIds;
      })
    });
  }

  /**
   * Builds the area form.
   */
  private buildForm() {
    this.linePathForm = this.fb.group({
      line: [null, [Validators.required]],
      path: [[], [Validators.required]], // TODO validate at least two points required!
    });
  }


  /**
   * Cancels the form.
   */
  cancel() {
    this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'topo-images']);
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
      this.linePathsService.addLinePath(linePath, this.topoImageId, this.areaSlug).subscribe(() => {
        this.store.dispatch(toastNotification(NotificationIdentifier.LINE_PATH_ADDED));
        this.router.navigate(['/topo', this.cragSlug, this.sectorSlug, this.areaSlug, 'topo-images']);
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }


}
