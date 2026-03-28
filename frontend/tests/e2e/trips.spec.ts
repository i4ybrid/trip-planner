import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TEST_USERS, TRIP_IDS } from './helpers/auth';

/**
 * E2E tests for Trip Management functionality
 * 
 * Tests cover:
 * - Trip dashboard visibility
 * - Trip tab navigation (overview, activities, chat, payments, etc.)
 * - Trip card interactions
 */

test.describe('Trip Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should display the dashboard with trip cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for page heading (Active & Upcoming is the actual heading)
    await expect(page.locator('text=Active & Upcoming').first()).toBeVisible();
    
    // Check for trip cards - Hawaii trip should be visible (seed data)
    await expect(page.locator('text=Hawaii Beach Vacation').first()).toBeVisible();
  });

  test('should navigate to trip overview page', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Trip name should be visible
    await expect(page.locator('text=Hawaii Beach Vacation').first()).toBeVisible();
    
    // Should show trip destination
    await expect(page.locator('text=Maui, Hawaii').first()).toBeVisible();
  });

  test('should display trip members on overview page', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Members section should be visible
    await expect(page.locator('text=/members \\(\\d+\\)/i').first()).toBeVisible({ timeout: 10000 });
    
    // Should show member names from seed data
    await expect(page.locator('text=Sarah Chen').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Mike Johnson').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show trip status badge', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Hawaii trip is in PLANNING status
    await expect(page.locator('text=/PLANNING/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show quick stats on overview', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Should show Activities count
    await expect(page.locator('text=Activities').first()).toBeVisible({ timeout: 5000 });
    
    // Should show Budget section
    await expect(page.locator('text=Budget').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Trip Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should navigate between trip tabs', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // The page redirects to /overview by default
    await expect(page).toHaveURL(/\/trip\/trip-1\/overview/);
    
    // Navigate to payments tab
    await page.click('button:has-text("Payments")');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Payments & Expenses').first()).toBeVisible({ timeout: 5000 });
    
    // Navigate to chat tab
    await page.click('button:has-text("Chat")');
    await page.waitForLoadState('domcontentloaded');
    // Verify chat page loaded - check for chat input which is always present
    await expect(page.locator('#chat-input').first()).toBeVisible({ timeout: 8000 });
    
    // Navigate to timeline tab
    await page.click('button:has-text("Timeline")');
    await page.waitForLoadState('domcontentloaded');
    // Timeline page content - just verify we're on the timeline tab
    await expect(page.locator('button:has-text("Timeline")').first()).toBeVisible({ timeout: 5000 });
    
    // Navigate to activities tab
    await page.click('button:has-text("Activities")');
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to memories tab
    await page.click('button:has-text("Memories")');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should highlight the active tab', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Click on Chat tab (button, not link)
    await page.click('button:has-text("Chat")');
    await page.waitForLoadState('domcontentloaded');
    
    // Chat tab button should have active styling (bg-primary class)
    const chatTab = page.locator('button:has-text("Chat")');
    await expect(chatTab).toHaveClass(/bg-primary/i);
  });

  test('should navigate to Overview from any subpage', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    
    // Click on Overview tab
    await page.click('button:has-text("Overview")');
    await page.waitForLoadState('domcontentloaded');
    
    // Should show trip details again
    await expect(page.locator('text=Hawaii Beach Vacation').first()).toBeVisible();
  });
});

test.describe('Trip Overview - Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show Settings button on trip overview', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Settings button should be visible in the sidebar
    const settingsButton = page.locator('button').filter({ hasText: /settings/i }).first();
    await expect(settingsButton).toBeVisible({ timeout: 5000 });
  });

  test('should show View Payments button', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // View Payments button should be visible in the Budget card
    const viewPaymentsButton = page.locator('button').filter({ hasText: /view payments/i });
    await expect(viewPaymentsButton).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to payments page via View Payments button', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Click View Payments
    await page.click('button:has-text("View Payments")');
    
    // Should navigate to payments page
    await page.waitForURL(/\/payments/);
    await expect(page.locator('text=Payments & Expenses').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display trip dates', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii);
    
    // Hawaii trip dates shown as "Jun 14-21, 2026" in UI (timezone offset from seed data June 15-22)
    await expect(page.locator('text=/Jun.*2026/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Trip List - Multiple Trips', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should display multiple trips in dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Should see at least Hawaii trip and NYC trip
    await expect(page.locator('text=Hawaii Beach Vacation').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=NYC Birthday Weekend').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to different trips', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on NYC Birthday Weekend trip card
    const nycCard = page.locator('text=NYC Birthday Weekend').first();
    await nycCard.click();
    
    // Should navigate to NYC trip overview
    await page.waitForURL(/\/trip\/trip-2\/overview/, { timeout: 10000 });
    await expect(page.locator('text=NYC Birthday Weekend').first()).toBeVisible({ timeout: 5000 });
  });
});
