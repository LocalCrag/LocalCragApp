import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Edit and delete line', () => {
  test('creates, renames, and deletes a disposable line under Shark Attack', async ({
    page,
  }) => {
    const suffix = Date.now();
    const name = `Pw Lifecycle Line ${suffix}`;
    const renamed = `Pw Lifecycle Line ${suffix} Edited`;

    await login(page);

    const createLinePromise = page.waitForResponse(
      (response) =>
        /\/areas\/[^/]+\/lines/.test(response.url()) &&
        response.request().method() === 'POST',
    );

    await page.goto('/topo/brione/pampelmousse/shark-attack/create-line');
    await page.locator('[data-cy="line-form-name"]').fill(name);
    await page.locator('[data-cy="line-form-description"] .ql-editor').click();
    await page
      .locator('[data-cy="line-form-description"] .ql-editor')
      .fill('Lifecycle line description.');
    await page.locator('[data-cy="grade-dropdown"] > div').click();
    await page.locator('[data-cy="grade-dropdown-item"]').nth(30).click();
    await page.locator('[data-cy="starting-position-dropdown"] > div').click();
    await page
      .locator('[data-cy="starting-position-dropdown-item"]')
      .nth(2)
      .click();
    await page.locator('[data-cy="rating"] .p-rating-option').nth(3).click();
    await page.locator('[data-cy="line-form-faName"]').fill('Shawn Raboutou');
    await page.locator('[data-cy="line-form-faYear"] input').click();
    await page.locator('.p-datepicker-year').nth(0).click();
    await page.locator('[data-cy="line-form-highball"]').click();
    await page.locator('[data-cy="submit"]').click();

    const createLine = await createLinePromise;
    const slug = (await createLine.json()).slug as string;
    await expect(page).toHaveURL(
      /\/topo\/brione\/pampelmousse\/shark-attack\/lines/,
    );
    await expect(
      page.locator('[data-cy="line-list-item"]').filter({ hasText: name }),
    ).toBeVisible();

    const updateLinePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/lines/${slug}`) &&
        response.request().method() === 'PUT',
    );
    await page.goto(`/topo/brione/pampelmousse/shark-attack/${slug}/edit`);
    await page.locator('[data-cy="line-form-name"]').clear();
    await page.locator('[data-cy="line-form-name"]').fill(renamed);
    await page.locator('[data-cy="submit"]').click();
    const updateLine = await updateLinePromise;
    const renamedSlug = (await updateLine.json()).slug as string;
    await expect(page).toHaveURL(
      new RegExp(`/topo/brione/pampelmousse/shark-attack/${renamedSlug}`),
    );

    const deleteLinePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/lines/${renamedSlug}`) &&
        response.request().method() === 'DELETE',
    );
    await page.goto(
      `/topo/brione/pampelmousse/shark-attack/${renamedSlug}/edit`,
    );
    await page.locator('[data-cy="delete"]').click();
    await page.locator('.p-confirmpopup-accept-button').nth(0).click();
    await deleteLinePromise;

    const listLinesPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/lines') &&
        response.request().method() === 'GET',
    );
    await page.goto('/topo/brione/pampelmousse/shark-attack/lines');
    await listLinesPromise;
    await expect(page.locator('[data-cy="line-list-item"]')).not.toHaveCount(0);
    await expect(
      page.locator('[data-cy="line-list-item"]').filter({ hasText: renamed }),
    ).toHaveCount(0);
  });
});
