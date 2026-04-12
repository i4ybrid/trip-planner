import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip } from './helpers/auth';
import { TRIP_IDS } from './helpers/auth';

test.describe('Trip - Invite Friend', () => {
  test('should invite a friend to an existing trip', async ({ page }) => {
    await loginTestUser(page, 'test');

    const tripId = TRIP_IDS.hawaii; // Hawaii Beach Vacation (test is MASTER)
    await navigateToTrip(page, tripId, 'overview', undefined);

    // Click "Invite" button in the overview header (opens InviteModal)
    const inviteBtn = page.locator('button:has-text("Invite")').first();
    await inviteBtn.click();
    await page.waitForTimeout(500);

    // Search for sarah by email in the invite modal (search triggers on Enter key)
    const searchInput = page.locator('input[placeholder="Search by email..."]').first();
    await searchInput.fill('sarah@example.com');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // Click "Invite" button in the search result
    const sendInviteBtn = page.locator('button:has-text("Invite")').first();
    await sendInviteBtn.click();
    await page.waitForTimeout(1000);

    // Should show confirmation that invite was sent (Invited badge appears)
    await page.waitForSelector('text=/invite sent|pending|invited/i', { timeout: 5000 });
  });

  test('should see invited member in trip members list', async ({ page }) => {
    await loginTestUser(page, 'test');

    const tripId = TRIP_IDS.hawaii;
    // Sarah should appear as a member in the overview's Members card
    await navigateToTrip(page, tripId, 'overview', undefined);
    await page.waitForTimeout(2000);
    // The Members card shows names, look for Sarah in the Members section
    const memberList = page.locator('text="Sarah"').first();
    await expect(memberList).toBeVisible({ timeout: 5000 });
  });
});
