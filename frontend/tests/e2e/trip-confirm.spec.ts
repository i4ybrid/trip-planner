import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip } from './helpers/auth';
import { TRIP_IDS } from './helpers/auth';

test.describe('Trip - Confirm', () => {
  test('should move trip from PLANNING to CONFIRMED', async ({ page }) => {
    await loginTestUser(page, 'test');

    const tripId = TRIP_IDS.hawaii;
    await navigateToTrip(page, tripId, 'overview', undefined);

    // Look for the status advancement button in the Trip Status card
    // Uses getAdvanceButtonLabel() which returns "Confirm Trip" for PLANNING->CONFIRMED transition
    // Button is in the Trip Status card (Badge + button layout)
    const confirmBtn = page.locator('.space-y-4 > div:first-child button:has-text("Confirm Trip"), button:has-text("Confirm Trip")').first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();
    await page.waitForTimeout(1000);

    // After confirming, trip status should change to CONFIRMED
    // Look for "Confirmed" badge or status indicator
    await page.waitForSelector('text=/Confirmed/i', { state: 'visible', timeout: 10000 });

    // The trip card on the dashboard should also show Confirmed status
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for the Hawaii trip with a "Confirmed" badge
    const confirmedBadge = page.locator('text="Hawaii"').locator("..").locator("text=/Confirmed/i").first();
    await expect(confirmedBadge).toBeVisible({ timeout: 5000 });
  });

  test('should show confirmed status in trip overview', async ({ page }) => {
    await loginTestUser(page, 'test');

    const tripId = TRIP_IDS.hawaii;
    // First, ensure the trip is confirmed
    await navigateToTrip(page, tripId, 'overview', undefined);
    const confirmBtn = page.locator('button:has-text("Confirm Trip")').first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to overview
    await navigateToTrip(page, tripId, 'overview', undefined);
    await page.waitForLoadState('domcontentloaded');

    // Confirmed status should appear on overview page
    await page.waitForSelector('text=/Confirmed/i', { state: 'visible', timeout: 5000 });
  });
});
