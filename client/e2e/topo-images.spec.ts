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
    await expect(editor.locator('canvas').first()).toBeVisible();

    // peter.jpeg is 271×186 and is scaled up to the editor width. Click in
    // fractions of the canvas so vertices stay far from each other and from
    // the inflated anchor hit-area (radius + hitStrokeWidth, in image px).
    const clickCanvas = async (nx: number, ny: number) => {
      const box = await editor.boundingBox();
      expect(box).toBeTruthy();
      await editor.click({
        position: { x: box!.width * nx, y: box!.height * ny },
      });
    };

    await clickCanvas(0.08, 0.12);
    await clickCanvas(0.22, 0.45);
    await clickCanvas(0.22, 0.78);
    await clickCanvas(0.4, 0.9);

    await page.locator('[data-cy="draw-mode"] > div').click();
    await page.locator('[data-cy="draw-mode-tabu"]').click();
    await expect(page.locator('[data-cy="draw-mode-tabu"]')).toBeHidden();
    await expect(page.locator('[data-cy="finish-tabu-area"]')).toBeVisible();
    // Right side of the image, well away from the line on the left.
    await clickCanvas(0.62, 0.12);
    await clickCanvas(0.9, 0.12);
    await clickCanvas(0.9, 0.55);
    const finishTabu = page.locator('[data-cy="finish-tabu-area"] button');
    await expect(finishTabu).toBeEnabled();
    await finishTabu.click();
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
