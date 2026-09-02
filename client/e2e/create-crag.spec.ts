import { test, expect } from '@playwright/test';
import { login, sampleImagePath } from './helpers/auth';

test.describe('Create crag', () => {
  test('creates a crag', async ({ page }) => {
    await login(page);
    await page.goto('/topo/create-crag');
    await page.locator('[data-cy="crag-form-name"]').fill('Ferschweiler');
    await page
      .locator('[data-cy="crag-form-shortDescription"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="crag-form-shortDescription"] .ql-editor')
      .fill('Ferschweiler is great.');
    await page.locator('[data-cy="crag-form-description"] .ql-editor').click();
    await page
      .locator('[data-cy="crag-form-description"] .ql-editor')
      .fill('Ferschweiler is very great.');
    await page.locator('[data-cy="crag-form-rules"] .ql-editor').click();
    await page
      .locator('[data-cy="crag-form-rules"] .ql-editor')
      .fill('No fires allowed!');
    await page
      .locator('[data-cy="crag-form-portraitImage"] input')
      .setInputFiles(sampleImagePath);
    await page.locator('[data-cy="open-marker-config-modal"]').nth(0).click();
    await page.locator('[data-cy="type-dropdown"] > div').click();
    await page.locator('[data-cy="type-dropdown-item"]').nth(0).click();
    await page.locator('[data-cy="lat"]').fill('90');
    await page.locator('[data-cy="lng"]').fill('180');
    await page.locator('[data-cy="save-marker"]').click();
    await page.locator('[data-cy="submit"]').click();
    await page.goto('/topo/crags');
    await expect(
      page.locator('[data-cy="crag-list-item"]').last(),
    ).toContainText('Ferschweiler');
  });
});
