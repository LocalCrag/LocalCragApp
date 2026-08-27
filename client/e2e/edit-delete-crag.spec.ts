import { test, expect } from '@playwright/test';
import { login, sampleImagePath } from './helpers/auth';

test.describe('Edit and delete crag', () => {
  test('creates, renames, and deletes a disposable crag', async ({ page }) => {
    const suffix = Date.now();
    const name = `Pw Lifecycle Crag ${suffix}`;
    const renamed = `Pw Lifecycle Crag ${suffix} Edited`;

    await login(page);

    const createCragPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/crags') &&
        response.request().method() === 'POST' &&
        !response.url().includes('/sectors'),
    );

    await page.goto('/topo/create-crag');
    await page.locator('[data-cy="crag-form-name"]').fill(name);
    await page
      .locator('[data-cy="crag-form-shortDescription"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="crag-form-shortDescription"] .ql-editor')
      .fill('Lifecycle crag short description.');
    await page.locator('[data-cy="crag-form-description"] .ql-editor').click();
    await page
      .locator('[data-cy="crag-form-description"] .ql-editor')
      .fill('Lifecycle crag description.');
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

    const createCrag = await createCragPromise;
    const slug = (await createCrag.json()).slug as string;
    await expect(page).toHaveURL(/\/topo\/crags/);
    await expect(
      page.locator('[data-cy="crag-list-item"]').filter({ hasText: name }),
    ).toBeVisible();

    const updateCragPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/crags/${slug}`) &&
        response.request().method() === 'PUT',
    );
    await page.goto(`/topo/${slug}/edit`);
    await page.locator('[data-cy="crag-form-name"]').clear();
    await page.locator('[data-cy="crag-form-name"]').fill(renamed);
    await page.locator('[data-cy="submit"]').click();
    const updateCrag = await updateCragPromise;
    const renamedSlug = (await updateCrag.json()).slug as string;
    await expect(page).toHaveURL(new RegExp(`/topo/${renamedSlug}`));

    const deleteCragPromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/crags/${renamedSlug}`) &&
        response.request().method() === 'DELETE',
    );
    await page.goto(`/topo/${renamedSlug}/edit`);
    await page.locator('[data-cy="delete"]').click();
    await page.locator('.p-confirmpopup-accept-button').nth(0).click();
    await deleteCragPromise;

    const listCragsPromise = page.waitForResponse(
      (response) =>
        /\/api\/crags\/?(\?|$)/.test(response.url()) &&
        response.request().method() === 'GET',
    );
    await page.goto('/topo/crags');
    await listCragsPromise;
    await expect(page.locator('[data-cy="crag-list-item"]')).not.toHaveCount(0);
    await expect(
      page.locator('[data-cy="crag-list-item"]').filter({ hasText: renamed }),
    ).toHaveCount(0);
  });
});
