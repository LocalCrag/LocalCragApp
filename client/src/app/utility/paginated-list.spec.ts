import { LoadingState } from '../enums/loading-state';
import {
  beginPaginatedPageLoad,
  canLoadNextPaginatedPage,
  completePaginatedPageLoad,
  failPaginatedPageLoad,
  isLoadingAdditionalPage,
  isLoadingFirstPage,
  isPaginatedListLoading,
  loadFirstPaginatedPage,
  PaginatedListLoadingContext,
  resetPaginatedList,
  startNextPaginatedPageLoad,
} from './paginated-list';

function createContext(
  overrides: Partial<PaginatedListLoadingContext> = {},
): PaginatedListLoadingContext {
  return {
    loading: LoadingState.DEFAULT,
    currentPage: 0,
    hasNextPage: true,
    ...overrides,
  };
}

describe('paginated-list', () => {
  it('tracks first-page loading via currentPage', () => {
    const ctx = createContext({
      loading: LoadingState.LOADING,
      currentPage: 1,
    });

    expect(isLoadingFirstPage(ctx)).toBe(true);
    expect(isLoadingAdditionalPage(ctx)).toBe(false);
    expect(isPaginatedListLoading(ctx)).toBe(true);
  });

  it('tracks additional-page loading via currentPage', () => {
    const ctx = createContext({
      loading: LoadingState.LOADING,
      currentPage: 3,
    });

    expect(isLoadingFirstPage(ctx)).toBe(false);
    expect(isLoadingAdditionalPage(ctx)).toBe(true);
  });

  it('loads pages sequentially', () => {
    const ctx = createContext();

    resetPaginatedList(ctx);
    expect(startNextPaginatedPageLoad(ctx)).toBe(1);
    expect(canLoadNextPaginatedPage(ctx)).toBe(false);

    completePaginatedPageLoad(ctx, true);
    expect(startNextPaginatedPageLoad(ctx)).toBe(2);
    expect(isLoadingAdditionalPage(ctx)).toBe(true);

    completePaginatedPageLoad(ctx, false);
    expect(canLoadNextPaginatedPage(ctx)).toBe(false);
  });

  it('rolls back the current page on failure', () => {
    const ctx = createContext();

    resetPaginatedList(ctx);
    startNextPaginatedPageLoad(ctx);
    failPaginatedPageLoad(ctx);

    expect(ctx.currentPage).toBe(0);
    expect(ctx.loading).toBe(LoadingState.DEFAULT);
    expect(canLoadNextPaginatedPage(ctx)).toBe(true);
  });

  it('loads the first page through shared helpers', () => {
    const ctx = createContext();
    const loadNextPage = jasmine.createSpy('loadNextPage');
    const afterReset = jasmine.createSpy('afterReset');

    loadFirstPaginatedPage(ctx, loadNextPage, afterReset);

    expect(ctx.currentPage).toBe(0);
    expect(loadNextPage).toHaveBeenCalled();
    expect(afterReset).toHaveBeenCalled();
  });

  it('clears items only when loading page one', () => {
    const ctx = createContext();
    const clearItems = jasmine.createSpy('clearItems');

    resetPaginatedList(ctx);
    beginPaginatedPageLoad(ctx, clearItems);
    expect(clearItems).toHaveBeenCalled();

    completePaginatedPageLoad(ctx, true);
    clearItems.calls.reset();
    beginPaginatedPageLoad(ctx, clearItems);
    expect(clearItems).not.toHaveBeenCalled();
  });
});
