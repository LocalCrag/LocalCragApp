import { Page } from '@playwright/test';

/**
 * The month/year picker opens on a year grid. Pick a year, then January.
 * Omit `year` to take the first year on the current page.
 */
export async function chooseMonthYear(page: Page, year?: number) {
  const grid = page.locator('hlm-month-year-calendar .grid');
  if (year == null) {
    await grid.locator('button').first().click();
  } else {
    await grid.getByText(String(year), { exact: true }).click();
  }
  await grid.getByText('Jan', { exact: true }).click();
}
