import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { Paginated } from '../../models/paginated';
import { ModeratorTask } from '../../models/moderator-task';
import { httpGetOptions } from '../../utility/http/query-params';
import {
  buildModeratorTaskListQuery,
  ModeratorTaskListQuery,
} from '../../modules/moderator-task/moderator-task-target';

@Injectable({ providedIn: 'root' })
export class ModeratorTasksService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getTasks(
    query: ModeratorTaskListQuery,
  ): Observable<Paginated<ModeratorTask>> {
    const queryParams = buildModeratorTaskListQuery(query);
    return this.http
      .get(this.api.moderatorTasks.getList(), httpGetOptions(queryParams))
      .pipe(
        map((payload) =>
          Paginated.deserialize(payload, ModeratorTask.deserialize),
        ),
      );
  }

  public getTask(taskId: string): Observable<ModeratorTask> {
    return this.http
      .get(this.api.moderatorTasks.getDetail(taskId))
      .pipe(map(ModeratorTask.deserialize));
  }

  public createTask(task: ModeratorTask): Observable<ModeratorTask> {
    return this.http
      .post(
        this.api.moderatorTasks.create(),
        ModeratorTask.serializeForCreate(task),
      )
      .pipe(map(ModeratorTask.deserialize));
  }

  public updateTask(task: ModeratorTask): Observable<ModeratorTask> {
    return this.http
      .put(
        this.api.moderatorTasks.update(task.id),
        ModeratorTask.serializeForUpdate(task),
      )
      .pipe(map(ModeratorTask.deserialize));
  }

  public toggleComplete(taskId: string): Observable<ModeratorTask> {
    return this.http
      .post(this.api.moderatorTasks.toggleComplete(taskId), null)
      .pipe(map(ModeratorTask.deserialize));
  }

  public deleteTask(taskId: string): Observable<null> {
    return this.http
      .delete(this.api.moderatorTasks.delete(taskId))
      .pipe(map(() => null));
  }
}
