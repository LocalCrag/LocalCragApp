import { test, expect } from '@playwright/test';

test.describe('Cookie test', () => {
  test('accepts the cookies', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-cy="accept-cookies"]').click();
    await expect(page.locator('[data-cy="accept-cookies"]')).toHaveCount(0);
  });
});
