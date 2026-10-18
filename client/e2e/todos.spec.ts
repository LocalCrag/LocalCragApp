import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Todo lifespan workflow', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('creates a to-do and deletes it again', async ({ page }) => {
    await login(page);

    await page.goto('/topo/brione/pampelmousse/shark-attack/lines');
    await page.locator('[data-cy="todo-button"]').nth(0).click();

    await page.goto('/todos');
    await expect(page.locator('[data-cy="todo-list-item"]')).toHaveCount(1);

    await page.locator('[data-cy="delete-todo"]').nth(0).click();
    await expect(page.locator('[data-cy="todo-list-item"]')).toHaveCount(0);
  });

  test('creates a to-do with high priority from the line list', async ({
    page,
  }) => {
    await login(page);

    await page.goto('/topo/brione/pampelmousse/shark-attack/lines');
    await page.locator('[data-cy="todo-priority-menu"]').nth(0).click();
    await page.locator('#todo-priority-high').click();

    await page.goto('/todos');
    const todo = page.locator('[data-cy="todo-list-item"]');
    await expect(todo).toHaveCount(1);
    await expect(todo.locator('.high-priority').first()).toBeVisible();

    await page.locator('[data-cy="delete-todo"]').nth(0).click();
    await expect(page.locator('[data-cy="todo-list-item"]')).toHaveCount(0);
  });
});
