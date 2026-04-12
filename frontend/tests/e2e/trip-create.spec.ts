import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Trip - Create', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');

    // Wait for session to fully establish after login
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.goto('/trip/new');
    await expect(page).toHaveURL(/\/trip\/new/);
  });

  test('should create a new trip with name, description, dates, and destination', async ({ page }) => {
    const timestamp = Date.now();
    const tripName = `My Trip ${timestamp}`;
    const destination = 'Paris, France';
    const description = 'A wonderful trip to Paris';

    // Fill trip form fields
    await page.fill('input[id="name"]', tripName);
    // Description is a textarea with no id - use placeholder
    await page.fill('textarea[placeholder="What\'s this trip about?"]', description);
    // Destination is an input with placeholder but no id
    await page.fill('input[placeholder="Hawaii, Paris, NYC..."]', destination);

    // Fill start date (datetime-local, first one is start date)
    const startDateInput = page.locator('input[type="datetime-local"]').first();
    await startDateInput.fill('2025-06-01T00:00');

    // Fill end date (second datetime-local is end date)
    const endDateInput = page.locator('input[type="datetime-local"]').nth(1);
    await endDateInput.fill('2025-06-10T23:59');

    // Submit form
    await page.click('button[type="submit"]');

    // Should navigate to the new trip page
    await page.waitForURL(/\/trip\/.+/, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');

    // Trip name should appear on the page
    await expect(page.locator(`text="${tripName}"`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error when required fields are missing', async ({ page }) => {
    // Leave required fields empty and submit
    await page.click('button[type="submit"]');

    // Should show validation error (form should not submit)
    await page.waitForSelector('text=/required|must enter|please/i', { state: 'visible', timeout: 5000 });
    // URL should remain on /trip/new
    await expect(page).toHaveURL(/\/trip\/new/);
  });
});
