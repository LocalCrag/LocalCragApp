import { test, expect } from '@playwright/test';
import { ignoreResizeObserverErrors, login } from './helpers/auth';

test.describe('Auth test', () => {
  test('logs in and out', async ({ page }) => {
    ignoreResizeObserverErrors(page);
    await login(page);
    await expect(page.locator('[data-cy="navbar-login"]')).toHaveCount(0);
    await page.locator('[data-cy="auth-menu-button"]').click();
    await page.locator('[data-cy="auth-menu"] #auth-menu-logout').click();
    await expect(page).toHaveURL(/\/login/);
  });
});
