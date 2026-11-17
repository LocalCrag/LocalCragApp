import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { chooseMonthYear } from './helpers/month-year';

test.describe('Create line', () => {
  test('creates a line', async ({ page }) => {
    await login(page);
    await page.goto('/topo/brione/pampelmousse/shark-attack/create-line');

    const createLinePromise = page.waitForResponse(
      (response) =>
        /\/areas\/[^/]+\/lines/.test(response.url()) &&
        response.request().method() === 'POST',
    );

    await page.locator('[data-cy="line-form-name"]').fill('Alphane');
    await page.locator('[data-cy="line-form-description"] .ql-editor').click();
    await page
      .locator('[data-cy="line-form-description"] .ql-editor')
      .fill('Upper Brione is very great.');
    await page
      .locator('[data-cy="grade-dropdown"] [data-slot="select-trigger"]')
      .click();
    await page.locator('[data-cy="grade-dropdown-item"]').nth(30).click();
    await page
      .locator(
        '[data-cy="starting-position-dropdown"] [data-slot="select-trigger"]',
      )
      .click();
    await page
      .locator('[data-cy="starting-position-dropdown-item"]')
      .nth(2)
      .click();
    await page.locator('[data-cy="rating"] button').nth(3).click();
    await page.locator('[data-cy="line-form-faName"]').fill('Shawn Raboutou');
    await chooseMonthYear(page, { picker: '[data-cy="line-form-faYear"]' });
    await page
      .locator('[data-cy="line-form-highball"] [role="checkbox"]')
      .click();
    await page.locator('[data-cy="submit"]').click();
    await createLinePromise;
    await expect(page).toHaveURL(
      /\/topo\/brione\/pampelmousse\/shark-attack\/lines/,
    );
    await expect(
      page.locator('[data-cy="line-list-item"]').filter({ hasText: 'Alphane' }),
    ).toBeVisible();
  });
});
