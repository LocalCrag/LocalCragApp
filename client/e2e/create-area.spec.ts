import { test, expect } from '@playwright/test';
import { login, sampleImagePath } from './helpers/auth';

test.describe('Create area', () => {
  test('creates an area', async ({ page }) => {
    await login(page);
    await page.goto('/topo/brione/pampelmousse/create-area');
    await page.locator('[data-cy="area-form-name"]').fill('Upper Brione');
    await page
      .locator('[data-cy="area-form-shortDescription"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="area-form-shortDescription"] .ql-editor')
      .fill('Upper Brione is great.');
    await page.locator('[data-cy="area-form-description"] .ql-editor').click();
    await page
      .locator('[data-cy="area-form-description"] .ql-editor')
      .fill('Upper Brione is very great.');
    await page
      .locator('[data-cy="area-form-portraitImage"] input')
      .setInputFiles(sampleImagePath);
    await page.locator('[data-cy="open-marker-config-modal"]').nth(0).click();
    await page.locator('[data-cy="type-dropdown"] > div').click();
    await page.locator('[data-cy="type-dropdown-item"]').nth(0).click();
    await page.locator('[data-cy="lat"]').fill('90');
    await page.locator('[data-cy="lng"]').fill('180');
    await page.locator('[data-cy="save-marker"]').click();
    await page.locator('[data-cy="submit"]').click();
    await page.goto('/topo/brione/pampelmousse/areas');
    await expect(
      page.locator('[data-cy="area-list-item"]').last(),
    ).toContainText('Upper Brione');
  });
});
