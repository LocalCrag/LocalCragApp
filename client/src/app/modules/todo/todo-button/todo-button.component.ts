import {
  Component,
  DestroyRef,
  Input,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { Line } from '../../../models/line';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { TodosService } from '../../../services/crud/todos.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { todoAdded } from '../../../ngrx/actions/todo.actions';
import { MenuItem } from 'primeng/api';
import { TodoPriority } from '../../../enums/todo-priority';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { LanguageService } from '../../../services/core/language.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-todo-button',
  imports: [ButtonModule, MenuModule, TranslocoDirective, NgClass],
  templateUrl: './todo-button.component.html',
  styleUrl: './todo-button.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class TodoButtonComponent {
  @Input() line: Line;
  @Input() isTodo: boolean;
  @Input() showLabel: boolean;

  public priorityItems: MenuItem[] = [];
  public priorities = TodoPriority;
  public saving = false;

  private todosService = inject(TodosService);
  private router = inject(Router);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.buildPriorityItems();
    this.languageService.renderedLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rendered) => {
        if (!rendered) return;
        this.buildPriorityItems();
      });
  }

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

  openPriorityMenu(event: MouseEvent, menu: Menu) {
    event.preventDefault();
    event.stopPropagation();
    menu.toggle(event);
  }

  private buildPriorityItems() {
    this.priorityItems = [
      {
        id: 'todo-priority-high',
        label: this.translocoService.translate(
          marker('todos.priorityButton.highPriority'),
        ),
        icon: 'pi pi-angle-up',
        styleClass: 'high-priority',
        command: () => this.addWithPriority(null, TodoPriority.HIGH),
      },
      {
        id: 'todo-priority-medium',
        label: this.translocoService.translate(
          marker('todos.priorityButton.mediumPriority'),
        ),
        icon: 'pi pi-angle-right',
        styleClass: 'medium-priority',
        command: () => this.addWithPriority(null, TodoPriority.MEDIUM),
      },
      {
        id: 'todo-priority-low',
        label: this.translocoService.translate(
          marker('todos.priorityButton.lowPriority'),
        ),
        icon: 'pi pi-angle-down',
        styleClass: 'low-priority',
        command: () => this.addWithPriority(null, TodoPriority.LOW),
      },
    ];
  }
}
