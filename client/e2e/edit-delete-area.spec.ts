import { test, expect } from '@playwright/test';
import { login, sampleImagePath } from './helpers/auth';

test.describe('Edit and delete area', () => {
  test('creates, renames, and deletes a disposable area under Brione/Pampelmousse', async ({
    page,
  }) => {
    const suffix = Date.now();
    const name = `Pw Lifecycle Area ${suffix}`;
    const renamed = `Pw Lifecycle Area ${suffix} Edited`;

    await login(page);

    const createAreaPromise = page.waitForResponse(
      (response) =>
        /\/sectors\/[^/]+\/areas/.test(response.url()) &&
        response.request().method() === 'POST',
    );

    await page.goto('/topo/brione/pampelmousse/create-area');
    await page.locator('[data-cy="area-form-name"]').fill(name);
    await page
      .locator('[data-cy="area-form-shortDescription"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="area-form-shortDescription"] .ql-editor')
      .fill('Lifecycle area short description.');
    await page.locator('[data-cy="area-form-description"] .ql-editor').click();
    await page
      .locator('[data-cy="area-form-description"] .ql-editor')
      .fill('Lifecycle area description.');
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

    const createArea = await createAreaPromise;
    const slug = (await createArea.json()).slug as string;
    await expect(page).toHaveURL(/\/topo\/brione\/pampelmousse\/areas/);
    await expect(
      page.locator('[data-cy="area-list-item"]').filter({ hasText: name }),
    ).toBeVisible();

    const updateAreaPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/areas/${slug}`) &&
        response.request().method() === 'PUT',
    );
    await page.goto(`/topo/brione/pampelmousse/${slug}/edit`);
    await page.locator('[data-cy="area-form-name"]').clear();
    await page.locator('[data-cy="area-form-name"]').fill(renamed);
    await page.locator('[data-cy="submit"]').click();
    const updateArea = await updateAreaPromise;
    const renamedSlug = (await updateArea.json()).slug as string;
    await expect(page).toHaveURL(
      new RegExp(`/topo/brione/pampelmousse/${renamedSlug}`),
    );

    const deleteAreaPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/areas/${renamedSlug}`) &&
        response.request().method() === 'DELETE',
    );
    await page.goto(`/topo/brione/pampelmousse/${renamedSlug}/edit`);
    await page.locator('[data-cy="delete"]').click();
    await page.locator('.p-confirmpopup-accept-button').nth(0).click();
    await deleteAreaPromise;

    const listAreasPromise = page.waitForResponse(
      (response) =>
        /\/sectors\/[^/]+\/areas/.test(response.url()) &&
        response.request().method() === 'GET',
    );
    await page.goto('/topo/brione/pampelmousse/areas');
    await listAreasPromise;
    await expect(page.locator('[data-cy="area-list-item"]')).not.toHaveCount(0);
    await expect(
      page.locator('[data-cy="area-list-item"]').filter({ hasText: renamed }),
    ).toHaveCount(0);
  });
});
