import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { Select } from 'primeng/select';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';

import { LoadingState } from '../../../enums/loading-state';
import { PageTitleService } from '../../../services/core/page-title.service';
import { ModeratorTask } from '../../../models/moderator-task';
import { ObjectType } from '../../../models/object';
import { ModeratorTasksService } from '../../../services/crud/moderator-tasks.service';
import { CragsService } from '../../../services/crud/crags.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { AreasService } from '../../../services/crud/areas.service';
import { LinesService } from '../../../services/crud/lines.service';
import { RegionService } from '../../../services/crud/region.service';
import { UsersService } from '../../../services/crud/users.service';
import { User } from '../../../models/user';
import { UploadService } from '../../../services/crud/upload.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

@Component({
  selector: 'lc-moderator-task-form',
  imports: [
    ButtonModule,
    ConfirmPopupModule,
    EditorModule,
    InputTextModule,
    Select,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './moderator-task-form.component.html',
  styleUrl: './moderator-task-form.component.scss',
  providers: [ConfirmationService],
})
export class ModeratorTaskFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public taskForm: FormGroup;
  public loadingState = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public editMode = false;
  public quillModules: any;
  public listLink: string;
  public assigneeUsers: User[] = [];
  public usersLoading = true;

  private taskId: string;
  private objectType: ObjectType;
  private objectId: string;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private moderatorTasksService = inject(ModeratorTasksService);
  private regionService = inject(RegionService);
  private cragsService = inject(CragsService);
  private sectorsService = inject(SectorsService);
  private areasService = inject(AreasService);
  private linesService = inject(LinesService);
  private usersService = inject(UsersService);
  private uploadService = inject(UploadService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  constructor() {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
    this.buildForm();
  }

  ngOnInit(): void {
    this.objectType = this.route.snapshot.data['scopeType'];
    this.listLink = this.buildListLink();
    this.taskId = this.route.snapshot.paramMap.get('task-id');
    this.editMode = !!this.taskId;
    this.setPageTitle();

    if (this.editMode) {
      forkJoin([
        this.moderatorTasksService.getTask(this.taskId).pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(null);
          }),
        ),
        this.usersService.getUsers({ isModerator: true }),
      ]).subscribe({
        next: ([task, users]) => {
          this.usersLoading = false;
          if (!task) return;
          this.objectType = task.objectType;
          this.objectId = task.objectId;
          this.assigneeUsers = users;
          this.taskForm.patchValue({
            title: task.title,
            description: task.description,
            assignedTo: task.assignedTo
              ? (users.find((user) => user.id === task.assignedTo.id) ??
                task.assignedTo)
              : null,
          });
          this.loadingState = LoadingState.DEFAULT;
        },
        error: () => {
          this.usersLoading = false;
          this.loadingState = LoadingState.DEFAULT;
        },
      });
      return;
    }

    forkJoin([
      this.resolveTargetObjectId(),
      this.usersService.getUsers({ isModerator: true }),
    ]).subscribe({
      next: ([objectId, users]) => {
        this.objectId = objectId;
        this.assigneeUsers = users;
        this.usersLoading = false;
        this.loadingState = LoadingState.DEFAULT;
      },
      error: () => {
        this.usersLoading = false;
        this.loadingState = LoadingState.DEFAULT;
      },
    });
  }

  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? marker('moderatorTasks.editTaskTitle')
          : marker('moderatorTasks.createTaskTitle'),
      ),
    );
  }

  public saveTask(): void {
    if (!this.taskForm.valid) {
      this.formDirective.markAsTouched();
      return;
    }
    this.loadingState = LoadingState.LOADING;
    const task = new ModeratorTask();
    task.title = this.taskForm.get('title').value;
    task.description = this.taskForm.get('description').value;
    const assignedTo = this.taskForm.get('assignedTo').value as User | null;
    if (assignedTo) {
      task.assignedTo = assignedTo;
    }

    const request$ = this.editMode
      ? (() => {
          task.id = this.taskId;
          return this.moderatorTasksService.updateTask(task);
        })()
      : (() => {
          task.objectType = this.objectType;
          task.objectId = this.objectId;
          return this.moderatorTasksService.createTask(task);
        })();

    request$.subscribe({
      next: () => {
        this.store.dispatch(
          toastNotification(
            this.editMode ? 'MODERATOR_TASK_UPDATED' : 'MODERATOR_TASK_CREATED',
          ),
        );
        this.router.navigate([this.listLink]);
      },
      error: () => {
        this.loadingState = LoadingState.DEFAULT;
      },
    });
  }

  public cancel(): void {
    this.router.navigate([this.listLink]);
  }

  public confirmDelete(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as HTMLElement,
      message: this.translocoService.translate(
        marker('moderatorTasks.deleteConfirm'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.loadingState = LoadingState.LOADING;
        this.moderatorTasksService.deleteTask(this.taskId).subscribe({
          next: () => {
            this.store.dispatch(toastNotification('MODERATOR_TASK_DELETED'));
            this.router.navigate([this.listLink]);
          },
        });
      },
    });
  }

  private buildForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(120)]],
      description: [''],
      assignedTo: [null],
    });
  }

  public assigneeLabel(user: User): string {
    return `${user.firstname} ${user.lastname}`.trim();
  }

  private resolveTargetObjectId() {
    const params = this.route.snapshot.paramMap;
    const cragSlug = params.get('crag-slug');
    const sectorSlug = params.get('sector-slug');
    const areaSlug = params.get('area-slug');
    const lineSlug = params.get('line-slug');

    if (this.objectType === ObjectType.Region) {
      return this.regionService
        .getRegion()
        .pipe(switchMap((region) => of(region.id)));
    }
    if (this.objectType === ObjectType.Crag) {
      return this.cragsService
        .getCrag(cragSlug)
        .pipe(switchMap((crag) => of(crag.id)));
    }
    if (this.objectType === ObjectType.Sector) {
      return this.sectorsService
        .getSector(sectorSlug)
        .pipe(switchMap((sector) => of(sector.id)));
    }
    if (this.objectType === ObjectType.Area) {
      return this.areasService
        .getArea(areaSlug)
        .pipe(switchMap((area) => of(area.id)));
    }
    return this.linesService
      .getLine(lineSlug)
      .pipe(switchMap((line) => of(line.id)));
  }

  private buildListLink(): string {
    const params = this.route.snapshot.paramMap;
    const cragSlug = params.get('crag-slug');
    const sectorSlug = params.get('sector-slug');
    const areaSlug = params.get('area-slug');
    const lineSlug = params.get('line-slug');

    if (this.objectType === ObjectType.Region) {
      return '/topo/moderator-tasks';
    }
    if (this.objectType === ObjectType.Crag) {
      return `/topo/${cragSlug}/moderator-tasks`;
    }
    if (this.objectType === ObjectType.Sector) {
      return `/topo/${cragSlug}/${sectorSlug}/moderator-tasks`;
    }
    if (this.objectType === ObjectType.Area) {
      return `/topo/${cragSlug}/${sectorSlug}/${areaSlug}/moderator-tasks`;
    }
    return `/topo/${cragSlug}/${sectorSlug}/${areaSlug}/${lineSlug}/moderator-tasks`;
  }
}
