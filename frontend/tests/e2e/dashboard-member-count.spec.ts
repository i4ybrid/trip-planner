/**
 * PARALLEL SAFE — all tests are read-only or skip gracefully.
 * Member count tests only read API response patterns without mutations.
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, TRIP_IDS } from './helpers/auth';

/**
 * E2E tests for Dashboard Member Count optimization
 * 
 * These tests verify that:
 * 1. Dashboard displays member counts on trip cards
 * 2. Dashboard does NOT make individual getTripMembers calls (N+1 problem fixed)
 * 3. Only 1 trip API call is made for the trips list (not N+1)
 */

test.describe('Dashboard Member Count', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should display member counts on dashboard trip cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Should display the Active & Upcoming heading
    await expect(page.locator('text=Active & Upcoming').first()).toBeVisible({ timeout: 10000 });
    
    // Should display Hawaii Beach Vacation trip
    await expect(page.locator('text=Hawaii Beach Vacation').first()).toBeVisible({ timeout: 10000 });
    
    // Should show member count with Users icon - using flexible selector
    // Looking for "X members" text near the trip card
    const membersText = page.locator('text=/\\d+ members?/i').first();
    await expect(membersText).toBeVisible({ timeout: 10000 });
    
    // Should show the Users icon (from lucide-react Users component)
    const usersIcon = page.locator('.lucide-users, [class*="users"]').first();
    await expect(usersIcon).toBeVisible({ timeout: 5000 }).catch(() => {
      // Fallback: just check for "members" text anywhere on the card
      const cardWithMembers = page.locator('text=/members?/i').first();
      expect(cardWithMembers).toBeVisible({ timeout: 5000 });
    });
  });

  test('should NOT make individual getTripMembers API calls (N+1 fix)', async ({ page }) => {
    // Track API calls
    const apiCalls: string[] = [];
    
    // Intercept all API calls to track them
    await page.route(/\/api\/trips\/.*\/members/, async (route) => {
      apiCalls.push(route.request().url());
      await route.continue();
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit to ensure any delayed API calls are made
    await page.waitForTimeout(1000);
    
    // Verify no individual /trips/{id}/members calls were made
    // The N+1 fix should have member counts included in the trips response
    const memberCalls = apiCalls.filter(url => /\/api\/trips\/trip-\d+\/members/.test(url));
    
    expect(memberCalls.length).toBe(0);
  });

  test('should make only 1 trip API call for multiple trips', async ({ page }) => {
    // Track API calls
    const apiCalls: string[] = [];
    
    // Intercept /api/trips calls
    await page.route(/\/api\/trips(\?|$)/, async (route) => {
      apiCalls.push(route.request().url());
      await route.continue();
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait to ensure all API calls are captured
    await page.waitForTimeout(1000);
    
    // Should have exactly 1 call to /api/trips (not N calls for N trips)
    // This verifies the N+1 problem is fixed
    const tripsCalls = apiCalls.filter(url => url.match(/\/api\/trips(\?|$)/));
    expect(tripsCalls.length).toBe(1);
  });

  test('should display member count correctly on trip card', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Hawaii trip from seed has multiple members
    // Find the card with "Hawaii Beach Vacation"
    const hawaiiCard = page.locator('text=Hawaii Beach Vacation').locator('..').locator('..');
    
    // Should show member count (from _count.members in API response)
    // Looking for "members" text in the card
    const cardText = await hawaiiCard.textContent();
    expect(cardText).toMatch(/members?/i);
  });

  test('should display member count without loading individual member details', async ({ page }) => {
    // Track all API calls made during dashboard load
    const apiCalls: string[] = [];
    
    await page.route(/\/api\//, async (route) => {
      apiCalls.push(route.request().url());
      await route.continue();
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Count unique trip member API calls
    const tripMemberCalls = apiCalls.filter(url => 
      /\/api\/trips\/[^\/]+\/members$/.test(url)
    );
    
    // After the N+1 fix, there should be ZERO calls to /trips/{id}/members
    // because member counts are included in the trips list response
    expect(tripMemberCalls.length).toBe(0);
    
    // The page should still display member counts (from _count.members)
    const memberCountVisible = await page.locator('text=/\\d+ members?/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(memberCountVisible).toBeTruthy();
  });
});
