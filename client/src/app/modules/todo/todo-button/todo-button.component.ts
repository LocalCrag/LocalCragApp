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
  lucidePlus,
} from '@ng-icons/lucide';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { Line } from '../../../models/line';
import { Store } from '@ngrx/store';
import { TodosService } from '../../../services/crud/todos.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { Router } from '@angular/router';
import { todoAdded } from '../../../ngrx/actions/todo.actions';
import { TodoPriority } from '../../../enums/todo-priority';

@Component({
  selector: 'lc-todo-button',
  imports: [
    HlmButton,
    ...HlmDropdownMenuImports,
    NgIcon,
    TranslocoDirective,
    TranslocoPipe,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronRight,
      lucideChevronUp,
      lucidePlus,
    }),
  ],
  templateUrl: './todo-button.component.html',
  styleUrl: './todo-button.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class TodoButtonComponent {
  @Input() line: Line;
  @Input() isTodo: boolean;
  @Input() showLabel: boolean;

  public priorities = TodoPriority;
  public saving = false;

  private todosService = inject(TodosService);
  private router = inject(Router);
  private store = inject(Store);

  addWithPriority(event: MouseEvent | null, priority: TodoPriority) {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.isTodo) {
      this.router.navigate(['/todos']);
      return;
    }
    if (this.saving) return;
    this.saving = true;
    this.todosService.createTodo(this.line, priority).subscribe({
      next: () => {
        this.saving = false;
        this.store.dispatch(todoAdded({ todoLineId: this.line.id }));
        this.store.dispatch(toastNotification('TODO_ADDED'));
      },
      error: () => {
        this.saving = false;
        this.store.dispatch(toastNotification('TODO_ADD_ERROR'));
      },
    });
  }
}
