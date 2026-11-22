import {
  Component,
  Input,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronRight,
  lucideChevronUp,
  lucideCircle,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { Todo } from '../../../models/todo';

import { TodoPriority } from '../../../enums/todo-priority';
import { TranslocoDirective } from '@jsverse/transloco';
import { TodosService } from '../../../services/crud/todos.service';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';

@Component({
  selector: 'lc-todo-priority-button',
  imports: [HlmButton, ...HlmDropdownMenuImports, NgIcon, TranslocoDirective],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronRight,
      lucideChevronUp,
      lucideCircle,
    }),
  ],
  templateUrl: './todo-priority-button.component.html',
  styleUrl: './todo-priority-button.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class TodoPriorityButtonComponent {
  @Input() todo: Todo;
  @Input() readOnly = false;

  public priorities = TodoPriority;

  private todosService = inject(TodosService);
  private store = inject(Store);

  setPriority(priority: TodoPriority) {
    this.todosService
      .updateTodoPriority(this.todo, priority)
      .subscribe((todo) => {
        this.todo.priority = todo.priority;
        this.store.dispatch(toastNotification('TODO_PRIORITY_UPDATED'));
      });
  }
}
