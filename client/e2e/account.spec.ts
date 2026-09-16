import { test, expect } from '@playwright/test';
import { ignoreResizeObserverErrors, login } from './helpers/auth';

test.describe('Account settings', () => {
  test('shows the current user role', async ({ page }) => {
    ignoreResizeObserverErrors(page);
    await login(page);
    await page.goto('/account');
    await expect(page.locator('[data-cy="account-role-tag"]')).toHaveText(
      '🎖️ Administrator',
    );
  });
});
