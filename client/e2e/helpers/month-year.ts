import { Locator, Page } from '@playwright/test';

/**
 * Open a month/year picker and choose a year, then January.
 * The field does not open when the text input is clicked; the calendar button does.
 * Omit `year` to take the first year on the current page.
 */
export async function chooseMonthYear(
  page: Page,
  options?: { year?: number; picker?: Locator | string },
) {
  const picker =
    typeof options?.picker === 'string'
      ? page.locator(options.picker)
      : (options?.picker ?? page.locator('hlm-month-year-picker'));
  await picker.getByRole('button', { name: 'Open calendar' }).click();

  const grid = page.locator('hlm-month-year-calendar .grid');
  if (options?.year == null) {
    await grid.locator('button').first().click();
  } else {
    await grid.getByText(String(options.year), { exact: true }).click();
  }
  await grid.getByText('Jan', { exact: true }).click();
}
