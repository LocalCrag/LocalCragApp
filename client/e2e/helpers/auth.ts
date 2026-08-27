import { expect, Page } from '@playwright/test';
import path from 'path';

/** Sample portrait used by create/edit form specs. */
export const sampleImagePath = path.join(
  __dirname,
  '../fixtures/images/peter.jpeg',
);

/**
 * Logs in as the seeded admin via the login form.
 * Uses /login directly so we do not depend on navbar timing.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page
    .locator('[data-cy="login-form-email"]')
    .fill('admin@localcrag.invalid.org');
  await page.locator('[data-cy="login-form-password"] input').fill('admin');

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/login') &&
      response.request().method() === 'POST',
  );
  await page.locator('[data-cy="login-form-submit"]').click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(202);

  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === 'lc_session')).toBeTruthy();
  expect(cookies.some((c) => c.name === 'lc_csrf')).toBeTruthy();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Ignore benign ResizeObserver noise from PrimeNG / browser. */
export function ignoreResizeObserverErrors(page: Page): void {
  page.on('pageerror', (err) => {
    if (
      err.message.includes(
        'ResizeObserver loop completed with undelivered notifications',
      )
    ) {
      return;
    }
    // Other page errors are still reported via Playwright's default handling.
    console.warn(`pageerror: ${err.message}`);
  });
}
