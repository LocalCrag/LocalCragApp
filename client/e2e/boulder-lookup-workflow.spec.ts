import { test, expect } from '@playwright/test';

test.describe('Boulder lookup workflow', () => {
  test('navigates step by step to a boulder detail page', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-cy="main-menu"] .root-child').nth(1).click();
    await page.locator('[data-cy="crag-list-item"]').nth(0).click();
    await page.locator('[data-cy="sector-list-item"]').nth(0).click();
    await page.locator('[data-cy="area-list-item"]').nth(0).click();
    await expect(page.locator('[data-cy="page-tabs-menu"]')).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('[data-cy="page-tabs-menu"] p-tab').nth(2).click();
    await page
      .locator('[data-cy="line-list-item"]')
      .filter({ hasText: 'Super-Spreader 8A' })
      .click({ timeout: 10_000 });
    await expect(page.locator('[data-cy="page-title-heading"]')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('[data-cy="page-title-heading"]')).toContainText(
      'Super-Spreader 8A',
    );
  });
});
