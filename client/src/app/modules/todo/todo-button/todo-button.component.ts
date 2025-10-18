import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { Line } from '../../../models/line';
import { TranslocoDirective } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { TodosService } from '../../../services/crud/todos.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { ButtonModule } from 'primeng/button';
import { NgClass, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { todoAdded } from '../../../ngrx/actions/todo.actions';

@Component({
  selector: 'lc-todo-button',
  imports: [ButtonModule, NgIf, TranslocoDirective, NgClass],
  templateUrl: './todo-button.component.html',
  styleUrl: './todo-button.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TodoButtonComponent {
  @Input() line: Line;
  @Input() isTodo: boolean;
  @Input() showLabel: boolean;

  private todosService = inject(TodosService);
  private router = inject(Router);
  private store = inject(Store);

  addTodo(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isTodo) {
      this.todosService.createTodo(this.line).subscribe({
        next: () => {
          this.store.dispatch(todoAdded({ todoLineId: this.line.id }));
          this.store.dispatch(toastNotification('TODO_ADDED'));
        },
        error: () => {
          this.store.dispatch(toastNotification('TODO_ADD_ERROR'));
        },
      });
    } else {
      this.router.navigate(['/todos']);
    }
  }
}
