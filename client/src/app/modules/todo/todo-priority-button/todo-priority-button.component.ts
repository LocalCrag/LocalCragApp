import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
  DestroyRef,
} from '@angular/core';
import { Todo } from '../../../models/todo';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';

import { TodoPriority } from '../../../enums/todo-priority';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TodosService } from '../../../services/crud/todos.service';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { LanguageService } from '../../../services/core/language.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-todo-priority-button',
  imports: [MenuModule, ButtonModule, TranslocoDirective],
  templateUrl: './todo-priority-button.component.html',
  styleUrl: './todo-priority-button.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TodoPriorityButtonComponent implements OnInit {
  @Input() todo: Todo;

  public items: MenuItem[];
  public priorities = TodoPriority;

  private todosService = inject(TodosService);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  setPriority(priority: TodoPriority) {
    this.todosService
      .updateTodoPriority(this.todo, priority)
      .subscribe((todo) => {
        this.todo.priority = todo.priority;
        this.store.dispatch(toastNotification('TODO_PRIORITY_UPDATED'));
      });
  }

  ngOnInit() {
    this.buildItems();
    this.languageService.renderedLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rendered) => {
        if (!rendered) return;
        this.buildItems();
      });
  }

  private buildItems() {
    this.items = [
      {
        label: this.translocoService.translate(
          marker('todos.priorityButton.highPriority'),
        ),
        icon: 'pi pi-angle-up',
        command: () => {
          this.setPriority(TodoPriority.HIGH);
        },
      },
      {
        label: this.translocoService.translate(
          marker('todos.priorityButton.mediumPriority'),
        ),
        icon: 'pi pi-angle-right',
        command: () => {
          this.setPriority(TodoPriority.MEDIUM);
        },
      },
      {
        label: this.translocoService.translate(
          marker('todos.priorityButton.lowPriority'),
        ),
        icon: 'pi pi-angle-down',
        command: () => {
          this.setPriority(TodoPriority.LOW);
        },
      },
    ];
  }
}
