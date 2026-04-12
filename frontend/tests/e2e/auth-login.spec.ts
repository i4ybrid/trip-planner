import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Auth - Login', () => {
  test('should login as existing user', async ({ page }) => {
    await loginTestUser(page, 'test');

    // Should land on dashboard
    await expect(page).toHaveURL(/dashboard/);
    await page.waitForLoadState('domcontentloaded');

    // Dashboard should render
    await expect(page.locator('text=/dashboard/i')).toBeVisible({ timeout: 5000 });
  });

  test('should login as sarah', async ({ page }) => {
    await loginTestUser(page, 'sarah');

    await expect(page).toHaveURL(/dashboard/);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=/dashboard/i')).toBeVisible({ timeout: 5000 });
  });

  test('should persist session after page reload', async ({ page }) => {
    await loginTestUser(page, 'test');
    await expect(page).toHaveURL(/dashboard/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(/dashboard/);
  });
});
