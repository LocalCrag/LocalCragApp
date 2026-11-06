import { MenuItem } from 'primeng/api';
import { TodoPriority } from '../../enums/todo-priority';

export interface LineContextMenuLabels {
  openInNewTab: string;
  addTodo: string;
  onTodoList: string;
  highPriority: string;
  mediumPriority: string;
  lowPriority: string;
  addAscent: string;
  lineClimbed: string;
  highlightOnImage: string;
  removeHighlight: string;
}

export interface LineContextMenuActions {
  openInNewTab: () => void;
  addTodo: (priority: TodoPriority) => void;
  openTodoList: () => void;
  tick: () => void;
  toggleHighlight: () => void;
}

export interface LineContextMenuState {
  loggedIn: boolean;
  isTodo: boolean;
  ticked: boolean;
  highlighted: boolean;
  publicationStatus: string;
}

/**
 * Menu for one line on a topo image.
 * Todo matches the line list: published lines the user has not ticked.
 * Tick matches the button already on this row: published and archived lines.
 */
export function buildLineContextMenuItems(
  state: LineContextMenuState,
  labels: LineContextMenuLabels,
  actions: LineContextMenuActions,
): MenuItem[] {
  const items: MenuItem[] = [
    {
      id: 'line-open-in-new-tab',
      label: labels.openInNewTab,
      icon: 'pi pi-external-link',
      command: () => actions.openInNewTab(),
    },
  ];

  const canTodo =
    state.loggedIn && state.publicationStatus === 'published' && !state.ticked;

  if (canTodo && state.isTodo) {
    items.push({
      id: 'line-on-todo-list',
      label: labels.onTodoList,
      icon: 'pi pi-plus',
      command: () => actions.openTodoList(),
    });
  } else if (canTodo) {
    items.push({
      id: 'line-add-todo',
      label: labels.addTodo,
      icon: 'pi pi-plus',
      items: [
        {
          id: 'line-todo-priority-high',
          label: labels.highPriority,
          icon: 'pi pi-angle-up',
          styleClass: 'high-priority',
          command: () => actions.addTodo(TodoPriority.HIGH),
        },
        {
          id: 'line-todo-priority-medium',
          label: labels.mediumPriority,
          icon: 'pi pi-angle-right',
          styleClass: 'medium-priority',
          command: () => actions.addTodo(TodoPriority.MEDIUM),
        },
        {
          id: 'line-todo-priority-low',
          label: labels.lowPriority,
          icon: 'pi pi-angle-down',
          styleClass: 'low-priority',
          command: () => actions.addTodo(TodoPriority.LOW),
        },
      ],
    });
  }

  const canTick =
    state.loggedIn &&
    (state.publicationStatus === 'published' ||
      state.publicationStatus === 'archived');

  if (canTick) {
    items.push({
      id: 'line-tick',
      label: state.ticked ? labels.lineClimbed : labels.addAscent,
      icon: 'pi pi-check',
      disabled: state.ticked,
      command: state.ticked ? undefined : () => actions.tick(),
    });
  }

  items.push({
    id: 'line-highlight',
    label: state.highlighted ? labels.removeHighlight : labels.highlightOnImage,
    icon: state.highlighted ? 'pi pi-eye-slash' : 'pi pi-eye',
    command: () => actions.toggleHighlight(),
  });

  return items;
}
