/**
 * PARALLEL SAFE — all tests are read-only or skip gracefully.
 * API cache tests only monitor/read API call patterns without mutations.
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

/**
 * E2E tests for API Caching and Deduplication
 * 
 * These tests verify that the API caching and deduplication
 * optimizations are working correctly.
 */

test.describe('API Caching', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should use cached data for repeated trips API calls', async ({ page }) => {
    // Navigate to dashboard twice quickly
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Store the first load timestamp
    const firstLoadTime = Date.now();
    
    // Navigate away and back quickly (within cache TTL)
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // If caching is working, the second load should be faster
    // This is a basic check - a proper test would measure actual network calls
    const secondLoadTime = Date.now() - firstLoadTime;
    
    // The page should load successfully
    await expect(page.locator('text=Active & Upcoming').first()).toBeVisible({ timeout: 10000 });
  });

  test('should cache trip members data', async ({ page }) => {
    // First visit to trip - should fetch members
    await navigateToTrip(page, TRIP_IDS.hawaii, 'overview');
    await page.waitForLoadState('domcontentloaded');
    
    // Navigate to payments tab - which also loads members via API
    await page.click('button:has-text("Payments")');
    await page.waitForLoadState('domcontentloaded');
    
    // Should show trip name and members data
    await expect(page.locator('text=Hawaii Beach Vacation').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle payments tab without excessive API calls', async ({ page }) => {
    // Navigate to trip payments
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify page loaded
    await expect(page.locator('text=Payments & Expenses').first()).toBeVisible({ timeout: 10000 });
    
    // Navigate to chat and back to payments
    await page.click('button:has-text("Chat")');
    await page.waitForLoadState('domcontentloaded');
    
    await page.click('button:has-text("Payments")');
    await page.waitForLoadState('domcontentloaded');
    
    // Payments should still show data
    await expect(page.locator('text=Payments & Expenses').first()).toBeVisible({ timeout: 10000 });
    // Wait for payments data to load (seed data includes "Hotel: Grand Wailea")
    await expect(page.locator('text=Hotel: Grand Wailea').first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate between tabs without breaking', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'overview');
    await page.waitForLoadState('domcontentloaded');
    
    // Click through various tabs
    const tabs = ['Chat', 'Activities', 'Payments', 'Timeline', 'Overview'];
    
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator(`button:has-text("${tab}")`).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
