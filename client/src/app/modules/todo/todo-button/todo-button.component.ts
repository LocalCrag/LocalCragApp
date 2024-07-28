import {Component, Input, ViewEncapsulation} from '@angular/core';
import {Line} from '../../../models/line';
import {TranslocoDirective} from '@ngneat/transloco';
import {Store} from '@ngrx/store';
import {TodosService} from '../../../services/crud/todos.service';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {ButtonModule} from 'primeng/button';
import {NgClass, NgIf} from '@angular/common';
import {SharedModule} from 'primeng/api';
import {Router} from '@angular/router';
import {todoAdded} from '../../../ngrx/actions/todo.actions';

@Component({
  selector: 'lc-todo-button',
  standalone: true,
  imports: [
    ButtonModule,
    NgIf,
    SharedModule,
    TranslocoDirective,
    NgClass
  ],
  templateUrl: './todo-button.component.html',
  styleUrl: './todo-button.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class TodoButtonComponent {

  @Input() line: Line;
  @Input() isTodo: boolean;
  @Input() showLabel: boolean;

  constructor(private todosService: TodosService,
              private router: Router,
              private store: Store) {
  }

  addTodo(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isTodo) {
      this.todosService.createTodo(this.line).subscribe(todo => {
        this.store.dispatch(todoAdded({todoLineId: this.line.id}));
        this.store.dispatch(toastNotification(NotificationIdentifier.TODO_ADDED))
      }, () => {
        this.store.dispatch(toastNotification(NotificationIdentifier.TODO_ADD_ERROR))
      })
    } else {
      this.router.navigate(['/todos']);
    }
  }

}
