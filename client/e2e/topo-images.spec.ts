import { test, expect } from '@playwright/test';
import { login, sampleImagePath } from './helpers/auth';

test.describe('Topo images test', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('adds a topo image and draws a line on it', async ({ page }) => {
    await login(page);

    await page.goto('/topo/brione/pampelmousse/shark-attack/topo-images');
    // Seed data has two topo images; wait until the list has rendered.
    // Do not assert an exact count so a retry after a partial run still works.
    await expect(
      page.locator('[data-cy="topo-image-list-item"]').first(),
    ).toBeVisible({ timeout: 15_000 });
    const numBefore = await page
      .locator('[data-cy="topo-image-list-item"]')
      .count();
    expect(numBefore).toBeGreaterThanOrEqual(2);

    const uploadFilePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/upload') &&
        response.request().method() === 'POST',
    );
    const createTopoImagePromise = page.waitForResponse(
      (response) =>
        /\/areas\/[^/]+\/topo-images/.test(response.url()) &&
        response.request().method() === 'POST',
    );

    await page.goto('/topo/brione/pampelmousse/shark-attack/add-topo-image');
    await page
      .locator('[data-cy="topo-image-input"] input')
      .setInputFiles(sampleImagePath);
    await uploadFilePromise;
    await page
      .locator('[data-cy="topo-image-form-coordinates"] input')
      .nth(0)
      .fill('90');
    await page
      .locator('[data-cy="topo-image-form-coordinates"] input')
      .nth(1)
      .fill('180');
    await page.locator('[data-cy="topo-image-form-title"]').fill('Great block');
    await page
      .locator('[data-cy="topo-image-form-description"] .ql-editor')
      .click();
    await page
      .locator('[data-cy="topo-image-form-description"] .ql-editor')
      .fill('Very big block indeed');
    await page.locator('[data-cy="submit"]').click();
    const createTopoImage = await createTopoImagePromise;
    const topoImageId = (await createTopoImage.json()).id as string;
    expect(topoImageId).toBeTruthy();

    await expect(page).toHaveURL(
      /\/topo\/brione\/pampelmousse\/shark-attack\/topo-images/,
    );
    await expect(page.locator('[data-cy="topo-image-list-item"]')).toHaveCount(
      numBefore + 1,
    );

    const createLinePathPromise = page.waitForResponse(
      (response) =>
        /\/topo-images\/[^/]+\/line-paths/.test(response.url()) &&
        response.request().method() === 'PUT',
    );

    await page.goto(
      `/topo/brione/pampelmousse/shark-attack/topo-images/${topoImageId}/edit-line-paths`,
    );
    await page.locator('[data-cy="line-dropdown"] > div').click({
      timeout: 15_000,
    });
    await page.locator('[data-cy="line-dropdown-item"]').nth(0).click();
    const editor = page.locator('lc-topo-image-editor');
    await editor.click({ position: { x: 10, y: 10 } });
    await editor.click({ position: { x: 100, y: 100 } });
    await editor.click({ position: { x: 100, y: 200 } });
    await editor.click({ position: { x: 200, y: 250 } });

    await page.locator('[data-cy="draw-mode"] > div').click();
    await page.locator('[data-cy="draw-mode-tabu"]').click();
    await expect(page.locator('[data-cy="draw-mode-tabu"]')).toBeHidden();
    await expect(page.locator('[data-cy="finish-tabu-area"]')).toBeVisible();
    // Keep tabu vertices off the line path (10,10)-(100,100)-(100,200)-(200,250)
    // so clicks hit the image instead of the existing stroke.
    await editor.click({ position: { x: 160, y: 40 } });
    await editor.click({ position: { x: 200, y: 40 } });
    await editor.click({ position: { x: 200, y: 90 } });
    await expect(page.locator('[data-cy="finish-tabu-area"]')).toBeEnabled();
    await page.locator('[data-cy="finish-tabu-area"]').click();
    await expect(
      page.locator('[data-cy="tabu-assign-checkbox-0"]'),
    ).toBeVisible();

    await page.locator('[data-cy="submit"]').click();
    const createLinePath = await createLinePathPromise;
    const requestPayload = createLinePath.request().postDataJSON();
    const savedLinePaths = await createLinePath.json();
    expect(requestPayload.tabuAreas).toHaveLength(1);
    expect(requestPayload.tabuAreas[0].path.length).toBeGreaterThanOrEqual(6);
    expect(savedLinePaths[0].tabuAreaIds).toEqual([
      requestPayload.tabuAreas[0].id,
    ]);
    await expect(page).toHaveURL(
      /\/topo\/brione\/pampelmousse\/shark-attack\/topo-images/,
    );
    await expect(
      page.locator(
        `[data-cy="topo-image-list-item"][id="${topoImageId}"] [data-cy="line-row"]`,
      ),
    ).toHaveCount(1);
  });
});
