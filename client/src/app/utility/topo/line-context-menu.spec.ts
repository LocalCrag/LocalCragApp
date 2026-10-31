import { MenuItem } from 'primeng/api';
import { TodoPriority } from '../../enums/todo-priority';
import {
  buildLineContextMenuItems,
  LineContextMenuActions,
  LineContextMenuLabels,
  LineContextMenuState,
} from './line-context-menu';

const labels: LineContextMenuLabels = {
  openInNewTab: 'open',
  addTodo: 'add',
  onTodoList: 'on-list',
  highPriority: 'high',
  mediumPriority: 'medium',
  lowPriority: 'low',
  addAscent: 'tick',
  lineClimbed: 'climbed',
  highlightOnImage: 'highlight',
  removeHighlight: 'remove',
};

function actions(): LineContextMenuActions {
  return {
    openInNewTab: jasmine.createSpy('openInNewTab'),
    addTodo: jasmine.createSpy('addTodo'),
    openTodoList: jasmine.createSpy('openTodoList'),
    tick: jasmine.createSpy('tick'),
    toggleHighlight: jasmine.createSpy('toggleHighlight'),
  };
}

function item(items: MenuItem[], id: string): MenuItem | undefined {
  return items.find((entry) => entry.id === id);
}

function menu(state: Partial<LineContextMenuState>, menuActions = actions()) {
  return {
    items: buildLineContextMenuItems(
      {
        loggedIn: true,
        isTodo: false,
        ticked: false,
        highlighted: false,
        publicationStatus: 'published',
        ...state,
      },
      labels,
      menuActions,
    ),
    actions: menuActions,
  };
}

describe('topo line context menu', () => {
  it('offers open and highlight to a logged-out visitor', () => {
    const built = menu({ loggedIn: false });
    expect(built.items.map((entry) => entry.id)).toEqual([
      'line-open-in-new-tab',
      'line-highlight',
    ]);
  });

  it('adds a published line with the chosen priority', () => {
    const built = menu({});
    const addTodo = item(built.items, 'line-add-todo');
    const medium = item(addTodo?.items ?? [], 'line-todo-priority-medium');
    medium?.command?.({} as never);
    expect(built.actions.addTodo).toHaveBeenCalledOnceWith(TodoPriority.MEDIUM);
    expect(item(built.items, 'line-tick')?.disabled).toBeFalsy();
  });

  it('opens the todo list when the line is already a todo', () => {
    const built = menu({ isTodo: true });
    expect(item(built.items, 'line-add-todo')).toBeUndefined();
    item(built.items, 'line-on-todo-list')?.command?.({} as never);
    expect(built.actions.openTodoList).toHaveBeenCalled();
  });

  it('disables tick when the line is already climbed', () => {
    const built = menu({ ticked: true });
    const tick = item(built.items, 'line-tick');
    expect(tick?.label).toBe('climbed');
    expect(tick?.disabled).toBeTrue();
    expect(item(built.items, 'line-add-todo')).toBeUndefined();
  });

  it('hides todo on an archived line and keeps tick', () => {
    const built = menu({ publicationStatus: 'archived' });
    expect(item(built.items, 'line-add-todo')).toBeUndefined();
    expect(item(built.items, 'line-tick')?.label).toBe('tick');
  });

  it('hides todo and tick on a draft', () => {
    const built = menu({ publicationStatus: 'draft' });
    expect(built.items.map((entry) => entry.id)).toEqual([
      'line-open-in-new-tab',
      'line-highlight',
    ]);
  });

  it('toggles the highlight label', () => {
    const built = menu({ highlighted: true });
    const highlight = item(built.items, 'line-highlight');
    expect(highlight?.label).toBe('remove');
    highlight?.command?.({} as never);
    expect(built.actions.toggleHighlight).toHaveBeenCalled();
  });
});
