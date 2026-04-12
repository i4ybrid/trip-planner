import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, ensureMilestones } from './helpers/auth';
import { TRIP_IDS } from './helpers/auth';

test.describe('Milestones - Create', () => {
  test('should show milestone dates', async ({ page }) => {
    await loginTestUser(page, 'test');

    const tripId = TRIP_IDS.nyc;
    await ensureMilestones(page, tripId);
    await navigateToTrip(page, tripId, 'timeline', 'Timeline');

    // Wait for the "Looking Ahead" section (all seed milestones for NYC are future-dated)
    // If no milestones exist yet, UnifiedTimeline shows EmptyState instead
    await page.waitForTimeout(2000);

    // The timeline renders milestone dates using formatDate = 'MMM d, yyyy' (e.g. "May 1, 2026")
    // Wait for a month name + day + year pattern that matches "May 1, 2026" style dates
    const milestoneDates = page.locator('text=/May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr [\d]+, 202[5-9]/').first();
    await expect(milestoneDates).toBeVisible({ timeout: 15000 });
  });
});
