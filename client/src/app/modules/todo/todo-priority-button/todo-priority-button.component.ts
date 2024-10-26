import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Todo } from '../../../models/todo';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { NgIf } from '@angular/common';
import { TodoPriority } from '../../../enums/todo-priority';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TodosService } from '../../../services/crud/todos.service';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';

@Component({
  selector: 'lc-todo-priority-button',
  standalone: true,
  imports: [MenuModule, ButtonModule, NgIf, TranslocoDirective],
  templateUrl: './todo-priority-button.component.html',
  styleUrl: './todo-priority-button.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TodoPriorityButtonComponent implements OnInit {
  @Input() todo: Todo;

  public items: MenuItem[];
  public priorities = TodoPriority;

  constructor(
    private todosService: TodosService,
    private translocoService: TranslocoService,
    private store: Store,
  ) {}

  setPriority(priority: TodoPriority) {
    this.todosService
      .updateTodoPriority(this.todo, priority)
      .subscribe((todo) => {
        this.todo.priority = todo.priority;
        this.store.dispatch(
          toastNotification(NotificationIdentifier.TODO_PRIORITY_UPDATED),
        );
      });
  }

  ngOnInit() {
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
