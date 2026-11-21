import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, switchMap } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

import { LoadingState } from '../../../enums/loading-state';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  failPaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { ModeratorTask } from '../../../models/moderator-task';
import { Region } from '../../../models/region';
import { User } from '../../../models/user';
import { RegionService } from '../../../services/crud/region.service';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { UsersService } from '../../../services/crud/users.service';
import { ObjectType } from '../../../models/object';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { ModeratorTasksService } from '../../../services/crud/moderator-tasks.service';
import {
  ASSIGNEE_FILTER_UNASSIGNED,
  getModeratorTaskTargetLinks,
  ModeratorTaskListQuery,
  ModeratorTaskScope,
} from '../moderator-task-target';

/** Selectable stand-in for "any". Spartan ignores a null option from the keyboard. */
const FILTER_ANY = '__any__';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { ModeratorTaskListSkeletonComponent } from '../moderator-task-list-skeleton/moderator-task-list-skeleton.component';
import { MenuItem } from '../../shared/models/menu-item';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideEllipsisVertical,
  lucideInfo,
  lucidePencil,
  lucidePlus,
  lucideTrash,
  lucideUser,
} from '@ng-icons/lucide';
import { lucideNameFromPrimeIcon } from '../../shared/utils/prime-icon';

type TaskListRow = { kind: 'task'; task: ModeratorTask } | { kind: 'divider' };

interface SelectItem<T = any> {
  label?: string;
  value?: T;
  [key: string]: any;
}

import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'lc-moderator-task-list',
  imports: [
    LoadingButtonComponent,
    ...HlmDropdownMenuImports,
    TranslocoDirective,
    FormsModule,
    RouterLink,
    NgClass,
    SanitizeHtmlPipe,
    DatePipe,
    UserAvatarComponent,
    InfiniteScrollDirective,
    ModeratorTaskListSkeletonComponent,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    HlmCheckbox,
    HlmSeparator,
    NgIcon,
  ],
  templateUrl: './moderator-task-list.component.html',
  styleUrl: './moderator-task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideEllipsisVertical,
      lucideInfo,
      lucidePencil,
      lucidePlus,
      lucideTrash,
      lucideUser,
    }),
  ],
})
export class ModeratorTaskListComponent implements OnInit, PaginatedListView {
  private confirmDialog = inject(ConfirmDialogService);
  readonly menuIcon = lucideNameFromPrimeIcon;

  public tasks: ModeratorTask[] = [];
  public loading = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public hasNextPage = true;
  public currentPage = 0;
  public createLink: string;
  public region: Region | null = null;
  public taskActionItems: MenuItem[] = [];
  public assigneeFilterOptions: SelectItem<string | null>[] = [];
  public userFilterOptions: SelectItem<string | null>[] = [];
  public usersLoading = true;
  public filterAssigneeId: string | null = null;
  public filterCreatorId: string | null = null;
  public filterFinisherId: string | null = null;
  public filterAnyLabel = '';

  filterOptionLabel = (value: string | null): string =>
    this.assigneeFilterOptions.find((option) => option.value === value)
      ?.label ??
    this.userFilterOptions.find((option) => option.value === value)?.label ??
    '';

  private scope: ModeratorTaskScope;
  private currentUserId: string | null = null;
  private togglingTaskIds = new Set<string>();
  private clickedTask: ModeratorTask | null = null;
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);
  private moderatorTasksService = inject(ModeratorTasksService);
  private usersService = inject(UsersService);
  private regionService = inject(RegionService);
  private cdr = inject(ChangeDetectorRef);

  public getTargetLinks = (task: ModeratorTask) =>
    getModeratorTaskTargetLinks(task, this.region);

  public get filtersActive(): boolean {
    return (
      this.isSpecificFilter(this.filterAssigneeId) ||
      this.isSpecificFilter(this.filterCreatorId) ||
      this.isSpecificFilter(this.filterFinisherId)
    );
  }

  public get myTasksActive(): boolean {
    return (
      this.currentUserId != null && this.filterAssigneeId === this.currentUserId
    );
  }

  public get dataViewRows(): TaskListRow[] {
    if (this.tasks.length === 0) {
      return [];
    }

    const rows: TaskListRow[] = [];
    let dividerAdded = false;
    for (const task of this.tasks) {
      if (
        task.completed &&
        !dividerAdded &&
        rows.some((row) => row.kind === 'task' && !row.task.completed)
      ) {
        rows.push({ kind: 'divider' });
        dividerAdded = true;
      }
      rows.push({ kind: 'task', task });
    }
    return rows;
  }

  public trackListRow(index: number, row: TaskListRow): string {
    if (row.kind === 'divider') {
      return `divider-${index}`;
    }
    return row.task.id;
  }

  ngOnInit(): void {
    this.store
      .select(selectCurrentUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUserId = user?.id ?? null;
        this.cdr.markForCheck();
      });

    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((data) => {
          this.scope = this.resolveScope(data['scopeType']);
          this.createLink = this.buildCreateLink();
          return forkJoin({
            users: this.usersService.getUsers({ isModerator: true }),
            region: this.regionService.getRegion(),
          });
        }),
      )
      .subscribe({
        next: ({ users, region }) => {
          this.region = region;
          this.buildUserFilterOptions(users);
          this.usersLoading = false;
          this.loadFirstPage();
          this.cdr.markForCheck();
        },
        error: () => {
          this.usersLoading = false;
          this.loading = LoadingState.DEFAULT;
          this.cdr.markForCheck();
        },
      });
  }

  public toggleMyTasksFilter(): void {
    if (!this.currentUserId) {
      return;
    }
    this.filterAssigneeId = this.myTasksActive
      ? FILTER_ANY
      : this.currentUserId;
    this.loadFirstPage();
  }

  public onFilterChange(): void {
    this.loadFirstPage();
  }

  public loadFirstPage(): void {
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  public loadNextPage(): void {
    const page = beginPaginatedPageLoad(this, () => {
      this.tasks = [];
    });
    if (page === null) {
      return;
    }

    this.moderatorTasksService
      .getTasks({
        scope: this.scope,
        page: this.currentPage,
        ...this.buildAssigneeListQuery(),
        createdById: this.isSpecificFilter(this.filterCreatorId)
          ? this.filterCreatorId
          : null,
        finishedById: this.isSpecificFilter(this.filterFinisherId)
          ? this.filterFinisherId
          : null,
      })
      .subscribe({
        next: (page) => {
          this.appendUniqueTasks(page.items);
          this.sortTasks();
          completePaginatedPageLoad(this, page.hasNext);
          this.cdr.markForCheck();
        },
        error: () => {
          failPaginatedPageLoad(this);
          this.cdr.markForCheck();
        },
      });
  }

  public isToggling(taskId: string): boolean {
    return this.togglingTaskIds.has(taskId);
  }

  public toggleComplete(task: ModeratorTask): void {
    if (this.togglingTaskIds.has(task.id)) {
      return;
    }

    const snapshot = {
      completed: task.completed,
      timeFinished: task.timeFinished,
      finishedBy: task.finishedBy,
    };

    this.togglingTaskIds.add(task.id);
    task.completed = !task.completed;
    if (task.completed) {
      task.timeFinished = new Date();
    } else {
      task.timeFinished = null;
      task.finishedBy = null;
    }
    this.sortTasks();
    this.cdr.markForCheck();

    this.moderatorTasksService.toggleComplete(task.id).subscribe({
      next: (updated) => {
        this.applyToggledTask(task, updated);
        this.store.dispatch(
          toastNotification(
            updated.completed
              ? 'MODERATOR_TASK_COMPLETED'
              : 'MODERATOR_TASK_REOPENED',
          ),
        );
        this.togglingTaskIds.delete(task.id);
        this.cdr.markForCheck();
      },
      error: () => {
        task.completed = snapshot.completed;
        task.timeFinished = snapshot.timeFinished;
        task.finishedBy = snapshot.finishedBy;
        this.sortTasks();
        this.togglingTaskIds.delete(task.id);
        this.cdr.markForCheck();
      },
    });
  }

  public editLink(taskId: string): string {
    return `${this.createLink.replace(/\/create$/, '')}/${taskId}/edit`;
  }

  public openTaskActions(event: Event, task: ModeratorTask): void {
    this.clickedTask = task;
    this.taskActionItems = this.buildTaskActionItems();
  }

  public confirmDeleteTask(task: ModeratorTask): void {
    this.confirmDialog.open({
      message: this.translocoService.translate(
        marker('moderatorTasks.deleteConfirm'),
      ),
      destructive: true,
      accept: () => this.deleteTask(task),
    });
  }

  private buildTaskActionItems(): MenuItem[] {
    const task = this.clickedTask;
    if (!task) {
      return [];
    }
    return [
      {
        label: this.translocoService.translate(
          marker('moderatorTasks.editTaskButton'),
        ),
        icon: 'pi pi-pencil',
        command: () => {
          this.router.navigate([this.editLink(task.id)]);
        },
      },
      {
        label: this.translocoService.translate(
          marker('moderatorTasks.deleteTaskButton'),
        ),
        icon: 'pi pi-trash',
        command: () => {
          this.confirmDeleteTask(task);
        },
      },
    ];
  }

  private deleteTask(task: ModeratorTask): void {
    this.moderatorTasksService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((item) => item.id !== task.id);
        this.store.dispatch(toastNotification('MODERATOR_TASK_DELETED'));
        this.cdr.markForCheck();
      },
    });
  }

  private applyToggledTask(task: ModeratorTask, updated: ModeratorTask): void {
    Object.assign(task, updated);
    if (!this.taskMatchesFilters(task)) {
      this.tasks = this.tasks.filter((item) => item.id !== task.id);
      return;
    }
    this.sortTasks();
  }

  private appendUniqueTasks(incoming: ModeratorTask[]): void {
    const existingIds = new Set(this.tasks.map((item) => item.id));
    for (const task of incoming) {
      if (!existingIds.has(task.id)) {
        this.tasks.push(task);
        existingIds.add(task.id);
      }
    }
  }

  private buildAssigneeListQuery(): Pick<
    ModeratorTaskListQuery,
    'assignedToId' | 'assignedToUnassigned'
  > {
    if (this.filterAssigneeId === ASSIGNEE_FILTER_UNASSIGNED) {
      return { assignedToUnassigned: true };
    }
    if (this.isSpecificFilter(this.filterAssigneeId)) {
      return { assignedToId: this.filterAssigneeId };
    }
    return {};
  }

  private taskMatchesFilters(task: ModeratorTask): boolean {
    if (this.filterAssigneeId === ASSIGNEE_FILTER_UNASSIGNED) {
      if (task.assignedTo != null) {
        return false;
      }
    } else if (
      this.isSpecificFilter(this.filterAssigneeId) &&
      task.assignedTo?.id !== this.filterAssigneeId
    ) {
      return false;
    }
    if (
      this.isSpecificFilter(this.filterCreatorId) &&
      task.createdBy?.id !== this.filterCreatorId
    ) {
      return false;
    }
    if (
      this.isSpecificFilter(this.filterFinisherId) &&
      task.finishedBy?.id !== this.filterFinisherId
    ) {
      return false;
    }
    return true;
  }

  private sortTasks(): void {
    const open = this.tasks.filter((task) => !task.completed);
    const completed = this.tasks.filter((task) => task.completed);
    open.sort((a, b) =>
      this.compareTasksByDateDesc(a.timeCreated, b.timeCreated, a.id, b.id),
    );
    completed.sort((a, b) =>
      this.compareTasksByDateDesc(a.timeFinished, b.timeFinished, a.id, b.id),
    );
    this.tasks = [...open, ...completed];
  }

  private compareTasksByDateDesc(
    aTime: Date | null | undefined,
    bTime: Date | null | undefined,
    aId: string,
    bId: string,
  ): number {
    const aTs = aTime?.getTime();
    const bTs = bTime?.getTime();
    if (aTs == null && bTs == null) {
      return bId.localeCompare(aId);
    }
    if (aTs == null) {
      return 1;
    }
    if (bTs == null) {
      return -1;
    }
    if (bTs !== aTs) {
      return bTs - aTs;
    }
    return bId.localeCompare(aId);
  }

  private buildUserFilterOptions(users: User[]): void {
    const anyLabel = this.translocoService.translate(
      marker('moderatorTasks.filterAnyUser'),
    );
    this.filterAnyLabel = anyLabel;
    const unassignedLabel = this.translocoService.translate(
      marker('moderatorTasks.unassigned'),
    );
    const sortedUsers = [...users].sort((a, b) =>
      this.formatUserName(a).localeCompare(this.formatUserName(b)),
    );
    const userOptions = sortedUsers.map((user) => ({
      label: this.formatUserName(user),
      value: user.id,
    }));
    this.assigneeFilterOptions = [
      { label: anyLabel, value: FILTER_ANY },
      { label: unassignedLabel, value: ASSIGNEE_FILTER_UNASSIGNED },
      ...userOptions,
    ];
    this.userFilterOptions = [
      { label: anyLabel, value: FILTER_ANY },
      ...userOptions,
    ];
  }

  private isSpecificFilter(value: string | null): value is string {
    return value != null && value !== FILTER_ANY;
  }

  private formatUserName(user: User): string {
    return `${user.firstname} ${user.lastname}`.trim();
  }

  private resolveScope(scopeType: ObjectType): ModeratorTaskScope {
    const params = this.route.parent!.parent!.snapshot.paramMap;
    const scope: ModeratorTaskScope = { scopeType };
    const cragSlug = params.get('crag-slug');
    const sectorSlug = params.get('sector-slug');
    const areaSlug = params.get('area-slug');
    const lineSlug = params.get('line-slug');
    if (cragSlug) scope.cragSlug = cragSlug;
    if (sectorSlug) scope.sectorSlug = sectorSlug;
    if (areaSlug) scope.areaSlug = areaSlug;
    if (lineSlug) scope.lineSlug = lineSlug;
    return scope;
  }

  private buildCreateLink(): string {
    const { scopeType, cragSlug, sectorSlug, areaSlug, lineSlug } = this.scope;
    if (scopeType === ObjectType.Region) {
      return '/topo/moderator-tasks/create';
    }
    if (scopeType === ObjectType.Crag) {
      return `/topo/${cragSlug}/moderator-tasks/create`;
    }
    if (scopeType === ObjectType.Sector) {
      return `/topo/${cragSlug}/${sectorSlug}/moderator-tasks/create`;
    }
    if (scopeType === ObjectType.Area) {
      return `/topo/${cragSlug}/${sectorSlug}/${areaSlug}/moderator-tasks/create`;
    }
    return `/topo/${cragSlug}/${sectorSlug}/${areaSlug}/${lineSlug}/moderator-tasks/create`;
  }
}
