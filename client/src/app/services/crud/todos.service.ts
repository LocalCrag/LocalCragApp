import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paginated } from '../../models/paginated';
import { map } from 'rxjs/operators';
import { Todo } from '../../models/todo';
import { Line } from '../../models/line';
import { TodoPriority } from '../../enums/todo-priority';

@Injectable({
  providedIn: 'root',
})
export class TodosService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public getTodos(filters: string): Observable<Paginated<Todo>> {
    return this.http
      .get(this.api.todos.getList(filters))
      .pipe(map((payload) => Paginated.deserialize(payload, Todo.deserialize)));
  }

  public createTodo(line: Line): Observable<Todo> {
    return this.http
      .post(this.api.todos.create(), { line: line.id })
      .pipe(map(Todo.deserialize));
  }

  public updateTodoPriority(
    todo: Todo,
    priority: TodoPriority,
  ): Observable<Todo> {
    return this.http
      .put(this.api.todos.updatePriority(todo.id), { priority })
      .pipe(map(Todo.deserialize));
  }

  public deleteTodo(todo: Todo): Observable<null> {
    return this.http
      .delete(this.api.todos.delete(todo.id))
      .pipe(map(() => null));
  }
}
