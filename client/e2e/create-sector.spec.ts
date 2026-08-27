import { test, expect } from '@playwright/test';
import { login, sampleImagePath } from './helpers/auth';

test.describe('Create sector', () => {
  test('creates a sector', async ({ page }) => {
    await login(page);
    await page.goto('/topo/brione/create-sector');
    await page.locator('[data-cy="sector-form-name"]').fill('Molonk');
    await page
      .locator('[data-cy="sector-form-shortDescription"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="sector-form-shortDescription"] .ql-editor')
      .fill('Molonk is great.');
    await page
      .locator('[data-cy="sector-form-description"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="sector-form-description"] .ql-editor')
      .fill('Molonk is very great.');
    await page.locator('[data-cy="sector-form-rules"] .ql-editor').click();
    await page
      .locator('[data-cy="sector-form-rules"] .ql-editor')
      .fill('No fires allowed!');
    await page
      .locator('[data-cy="sector-form-portraitImage"] input')
      .setInputFiles(sampleImagePath);
    await page.locator('[data-cy="open-marker-config-modal"]').nth(0).click();
    await page.locator('[data-cy="type-dropdown"] > div').click();
    await page.locator('[data-cy="type-dropdown-item"]').nth(0).click();
    await page.locator('[data-cy="lat"]').fill('90');
    await page.locator('[data-cy="lng"]').fill('180');
    await page.locator('[data-cy="save-marker"]').click();
    await page.locator('[data-cy="submit"]').click();
    await page.goto('/topo/brione/sectors');
    await expect(
      page.locator('[data-cy="sector-list-item"]').last(),
    ).toContainText('Molonk');
  });
});
