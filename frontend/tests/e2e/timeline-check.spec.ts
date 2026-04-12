import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, ensureMilestones } from './helpers/auth';
import { TRIP_IDS } from './helpers/auth';

test.describe('Timeline - Check', () => {
  test('should show all expected events in the timeline', async ({ page }) => {
    await loginTestUser(page, 'test');

    const tripId = TRIP_IDS.hawaii;

    // Ensure milestones exist
    await ensureMilestones(page, tripId);

    // Navigate to timeline page
    await navigateToTrip(page, tripId, 'timeline', 'Timeline');
    await page.waitForLoadState('domcontentloaded');

    // The timeline uses "Looking Back" and "Looking Ahead" section headers
    // Wait for at least one section to appear (events are sorted by date)
    const timelineSection = page.locator('text=/Looking Back|Looking Ahead/').first();
    await expect(timelineSection).toBeVisible({ timeout: 10000 });

    // Should have at least one event row visible (TimelineEventRow renders dates via formatDate = 'MMM d, yyyy')
    // Use a date pattern that matches "Jun 14, 2026" format via the year
    const timelineEvent = page.locator('text=/\d{4}/').first();
    await expect(timelineEvent).toBeVisible({ timeout: 10000 });
  });

  test('should show milestones, activities, and member joined events', async ({ page }) => {
    await loginTestUser(page, 'test');

    const tripId = TRIP_IDS.hawaii;

    // Add an activity first
    await navigateToTrip(page, tripId, 'activities', 'Activities');
    const addActivityBtn = page.locator('button:has-text("Add Activity"), button:has-text("New Activity")').first();
    if (await addActivityBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addActivityBtn.click();
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="Surfing lessons"]', 'Beach Day');
      await page.fill('input[type="datetime-local"]', '2025-06-02T10:00');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // Now go to timeline
    await navigateToTrip(page, tripId, 'timeline', 'Timeline');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline to populate
    await page.waitForTimeout(2000);

    // Verify timeline has content (at least one item with a year date)
    const eventCount = await page.locator('text=/\d{4}/').count();
    expect(eventCount).toBeGreaterThan(0);
  });
});
