import { LoadingState } from '../enums/loading-state';

/**
 * Shared pagination state for infinite-scroll list views.
 *
 * Components keep these fields as own properties and pass `this` into the
 * helpers below. First-page vs. load-more loading is derived from
 * `currentPage`, so separate loading flags are not needed.
 */
export interface PaginatedListLoadingContext {
  loading: LoadingState;
  currentPage: number;
  hasNextPage: boolean;
}

/**
 * Contract implemented by paginated list components.
 *
 * Templates typically use `loading`, `currentPage`, and `loadingStates`
 * together, e.g. `loading === loadingStates.LOADING && currentPage === 1`
 * for the initial skeleton.
 */
export interface PaginatedListView extends PaginatedListLoadingContext {
  readonly loadingStates: typeof LoadingState;
  loadFirstPage(): void;
  loadNextPage(): void;
}

/** True while any page request is in flight. */
export function isPaginatedListLoading(
  ctx: PaginatedListLoadingContext,
): boolean {
  return ctx.loading === LoadingState.LOADING;
}

/** True while the first page is loading (`currentPage === 1`). */
export function isLoadingFirstPage(ctx: PaginatedListLoadingContext): boolean {
  return ctx.loading === LoadingState.LOADING && ctx.currentPage === 1;
}

/** True while a subsequent page is loading (`currentPage > 1`). */
export function isLoadingAdditionalPage(
  ctx: PaginatedListLoadingContext,
): boolean {
  return ctx.loading === LoadingState.LOADING && ctx.currentPage > 1;
}

/** True when another page can be requested. */
export function canLoadNextPaginatedPage(
  ctx: PaginatedListLoadingContext,
): boolean {
  return ctx.loading !== LoadingState.LOADING && ctx.hasNextPage;
}

/** Resets pagination before a filter change or full reload. */
export function resetPaginatedList(ctx: PaginatedListLoadingContext): void {
  ctx.currentPage = 0;
  ctx.hasNextPage = true;
  ctx.loading = LoadingState.DEFAULT;
}

/**
 * Starts loading the next page.
 *
 * @returns The page number being loaded, or `null` if loading is blocked.
 */
export function startNextPaginatedPageLoad(
  ctx: PaginatedListLoadingContext,
): number | null {
  if (!canLoadNextPaginatedPage(ctx)) {
    return null;
  }

  ctx.currentPage += 1;
  ctx.loading = LoadingState.LOADING;
  return ctx.currentPage;
}

/**
 * Resets pagination and immediately triggers the first fetch.
 *
 * Use from `loadFirstPage()`. Optional `afterReset` runs after the reset and
 * before `loadNextPage`, e.g. to snapshot active filter values.
 */
export function loadFirstPaginatedPage(
  view: PaginatedListLoadingContext,
  loadNextPage: () => void,
  afterReset?: () => void,
): void {
  if (view.loading === LoadingState.LOADING) {
    return;
  }
  resetPaginatedList(view);
  afterReset?.();
  loadNextPage();
}

/**
 * Starts the next page load and clears list data when page 1 is requested.
 *
 * Use at the start of `loadNextPage()`. Return early when the result is
 * `null`.
 */
export function beginPaginatedPageLoad(
  view: PaginatedListLoadingContext,
  clearOnFirstPage?: () => void,
): number | null {
  const page = startNextPaginatedPageLoad(view);
  if (page === 1) {
    clearOnFirstPage?.();
  }
  return page;
}

/** Call after a successful page fetch. */
export function completePaginatedPageLoad(
  ctx: PaginatedListLoadingContext,
  hasNext: boolean,
): void {
  ctx.hasNextPage = hasNext;
  ctx.loading = LoadingState.DEFAULT;
}

/** Call after a failed page fetch to undo the page increment. */
export function failPaginatedPageLoad(ctx: PaginatedListLoadingContext): void {
  ctx.currentPage -= 1;
  ctx.loading = LoadingState.DEFAULT;
}
