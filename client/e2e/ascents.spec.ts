import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Ascent lifespan workflow', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('creates an ascent and deletes it again', async ({ page }) => {
    await login(page);

    await page.goto('/topo/brione/pampelmousse/shark-attack/topo-images');
    await page.locator('[data-cy="tick-button"]').nth(1).click();
    await page.locator('[data-cy="rating"] .p-rating-option').nth(3).click();
    await page.locator('[data-cy="comment"]').focus();
    await page.locator('[data-cy="comment"]').fill('Good boulder yo!');
    await page.locator('[data-cy="withKneepad"]').click();
    await page.locator('[data-cy="submit"]').click();

    await page.goto('/users/admin-admin');
    await expect(page.locator('[data-cy="kneepadtag"]:visible')).toHaveCount(2);
    await page
      .locator('[data-cy="ascent-actions-button"]:visible')
      .first()
      .click();
    await page.locator('#edit-ascent').nth(0).click();
    await page.locator('[data-cy="withKneepad"]').click();
    await page.locator('[data-cy="submit"]').click();
    await expect(page.locator('[data-cy="kneepadtag"]:visible')).toHaveCount(1);

    await expect(page.locator('[data-cy="ascent-list-item"]')).toHaveCount(2);
    await page
      .locator('[data-cy="ascent-actions-button"]:visible')
      .first()
      .click();
    await page.locator('#delete-ascent').nth(0).click();
    await page.locator('.p-confirmpopup-accept-button').nth(0).click();
    await expect(page.locator('[data-cy="ascent-list-item"]')).toHaveCount(1);
  });

  test('creates an ascent with year instead of date', async ({ page }) => {
    await login(page);

    const ascentYear = new Date().getFullYear() - 1;

    const createAscentPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/ascents') &&
        response.request().method() === 'POST',
    );

    await page.goto('/topo/brione/pampelmousse/shark-attack/topo-images');
    await page.locator('[data-cy="tick-button"]').nth(1).click();
    await page.locator('[data-cy="yearOnly"]').click();
    await page.locator('#year').click();
    await page
      .locator('.p-datepicker-year')
      .filter({ hasText: String(ascentYear) })
      .click();
    await page.locator('[data-cy="rating"] .p-rating-option').nth(3).click();
    await page.locator('[data-cy="comment"]').focus();
    await page.locator('[data-cy="comment"]').fill('Year-only ascent');
    await page.locator('[data-cy="submit"]').click();

    const createAscent = await createAscentPromise;
    expect(createAscent.status()).toBe(201);
    const body = createAscent.request().postDataJSON();
    expect(body.year).toBe(ascentYear);
    expect(body.date).toBeNull();

    await page.goto('/users/admin-admin');
    await expect(page.locator('[data-cy="ascent-list-item"]')).toHaveCount(2);
    await expect(
      page.locator('[data-cy="ascent-date"]:visible').first(),
    ).toContainText(String(ascentYear));

    await page
      .locator('[data-cy="ascent-actions-button"]:visible')
      .first()
      .click();
    await page.locator('#delete-ascent').nth(0).click();
    await page.locator('.p-confirmpopup-accept-button').nth(0).click();
    await expect(page.locator('[data-cy="ascent-list-item"]')).toHaveCount(1);
  });
});
