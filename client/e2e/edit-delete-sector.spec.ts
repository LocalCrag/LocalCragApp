import { test, expect } from '@playwright/test';
import { login, sampleImagePath } from './helpers/auth';

test.describe('Edit and delete sector', () => {
  test('creates, renames, and deletes a disposable sector under Brione', async ({
    page,
  }) => {
    const suffix = Date.now();
    const name = `Pw Lifecycle Sector ${suffix}`;
    const renamed = `Pw Lifecycle Sector ${suffix} Edited`;

    await login(page);

    const createSectorPromise = page.waitForResponse(
      (response) =>
        /\/crags\/[^/]+\/sectors/.test(response.url()) &&
        response.request().method() === 'POST',
    );

    await page.goto('/topo/brione/create-sector');
    await page.locator('[data-cy="sector-form-name"]').fill(name);
    await page
      .locator('[data-cy="sector-form-shortDescription"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="sector-form-shortDescription"] .ql-editor')
      .fill('Lifecycle sector short description.');
    await page
      .locator('[data-cy="sector-form-description"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="sector-form-description"] .ql-editor')
      .fill('Lifecycle sector description.');
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

    const createSector = await createSectorPromise;
    const slug = (await createSector.json()).slug as string;
    await expect(page).toHaveURL(/\/topo\/brione\/sectors/);
    await expect(
      page.locator('[data-cy="sector-list-item"]').filter({ hasText: name }),
    ).toBeVisible();

    const updateSectorPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/sectors/${slug}`) &&
        response.request().method() === 'PUT',
    );
    await page.goto(`/topo/brione/${slug}/edit`);
    await page.locator('[data-cy="sector-form-name"]').clear();
    await page.locator('[data-cy="sector-form-name"]').fill(renamed);
    await page.locator('[data-cy="submit"]').click();
    const updateSector = await updateSectorPromise;
    const renamedSlug = (await updateSector.json()).slug as string;
    await expect(page).toHaveURL(new RegExp(`/topo/brione/${renamedSlug}`));

    const deleteSectorPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/sectors/${renamedSlug}`) &&
        response.request().method() === 'DELETE',
    );
    await page.goto(`/topo/brione/${renamedSlug}/edit`);
    await page.locator('[data-cy="delete"]').click();
    await page.locator('.p-confirmpopup-accept-button').nth(0).click();
    await deleteSectorPromise;

    const listSectorsPromise = page.waitForResponse(
      (response) =>
        /\/crags\/[^/]+\/sectors/.test(response.url()) &&
        response.request().method() === 'GET',
    );
    await page.goto('/topo/brione/sectors');
    await listSectorsPromise;
    await expect(page.locator('[data-cy="sector-list-item"]')).not.toHaveCount(
      0,
    );
    await expect(
      page.locator('[data-cy="sector-list-item"]').filter({ hasText: renamed }),
    ).toHaveCount(0);
  });
});
