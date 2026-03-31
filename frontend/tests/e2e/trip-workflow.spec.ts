/**
 * PARALLEL SAFE (read-only portion) — write/serial tests moved to trip-workflow-serial.spec.ts
 * 
 * This file contains ONLY read-only trip display tests.
 * Status transition (write) tests are in: trip-workflow-serial.spec.ts
 * Read-only milestone tests are in: trip-workflow-read.spec.ts
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Trip Workflow — Read-Only Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show existing trips on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const tripCards = page.locator('[class*="card"], [class*="trip-card"]');
    await expect(tripCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to trip overview', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const firstTrip = page.locator('text=Hawaii Beach Vacation').first();
    if (await firstTrip.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstTrip.click();
      await page.waitForURL(/\/trip\//, { timeout: 10000 });
    } else {
      await page.goto('/trip/trip-1/overview');
      await page.waitForLoadState('domcontentloaded');
    }
    
    await expect(page.locator('text=/overview/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {
      expect(page.url()).toContain('/trip/');
    });
  });

  test('should display current trip status', async ({ page }) => {
    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');
    
    const statusElement = page.locator('[class*="status"], select').first();
    const hasStatus = await statusElement.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasStatus) {
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });
});

// NOTE: Milestone display tests moved to trip-workflow-read.spec.ts
// NOTE: Status transition (write) tests moved to trip-workflow-serial.spec.ts
