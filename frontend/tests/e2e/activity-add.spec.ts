import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip } from './helpers/auth';
import { TRIP_IDS } from './helpers/auth';

test.describe('Activity - Add', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should add an activity to a trip', async ({ page }) => {
    const tripId = TRIP_IDS.hawaii;
    await navigateToTrip(page, tripId, 'activities', 'Activities');

    // Click "Add Activity" button
    const addActivityBtn = page.locator('button:has-text("Add Activity"), button:has-text("New Activity")').first();
    await addActivityBtn.click();
    await page.waitForTimeout(500);

    // Fill activity form
    const activityTitle = `Sightseeing ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="Surfing lessons"]').first();
    await titleInput.fill(activityTitle);

    // Fill location
    const locationInput = page.locator('input[placeholder="Location"]').first();
    await locationInput.fill('Eiffel Tower, Paris');

    // Set a start time (datetime-local)
    const startTimeInput = page.locator('input[type="datetime-local"]').first();
    await startTimeInput.fill('2025-06-05T10:00');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Activity should appear in the list
    await expect(page.locator(`text="${activityTitle}"`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should fill and submit activity form with all fields', async ({ page }) => {
    const tripId = TRIP_IDS.hawaii;
    await navigateToTrip(page, tripId, 'activities', 'Activities');

    const addActivityBtn = page.locator('button:has-text("Add Activity"), button:has-text("New Activity")').first();
    await addActivityBtn.click();
    await page.waitForTimeout(500);

    // Fill title
    await page.fill('input[placeholder="Surfing lessons"]', 'Wine Tasting');

    // Fill description if field exists
    const descInput = page.locator("textarea[placeholder*='What\\'s this activity about']").first();
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.fill('A relaxing wine tasting experience');
    }

    // Fill location
    await page.fill('input[placeholder="Location"]', 'Bordeaux Vineyard');

    // Set start time
    await page.fill('input[type="datetime-local"]', '2025-06-07T14:00');

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await expect(page.locator('text="Wine Tasting"').first()).toBeVisible({ timeout: 10000 });
  });
});
