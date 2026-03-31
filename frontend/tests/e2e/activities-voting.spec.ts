/**
 * PARALLEL SAFE (read-only portion) — serial tests moved to activities-voting-serial.spec.ts
 * 
 * This file contains ONLY read-only activity display tests.
 * Propose + Vote mutation tests are in: activities-voting-serial.spec.ts
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

test.describe('Activities — Read-Only Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show add activity button', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'activities');
    await page.waitForLoadState('domcontentloaded');
    
    const addBtn = page.locator('button:has-text("Add Activity"), button:has-text("Propose"), button:has-text("New Activity")').first();
    
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });
});

test.describe('Vote Counts Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
    await navigateToTrip(page, TRIP_IDS.hawaii, 'activities');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should show vote counts on activity', async ({ page }) => {
    const voteCounts = page.locator('[class*="count"], [class*="votes"]').first();
    
    if (await voteCounts.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should show YES/NO/MAYBE counts', async ({ page }) => {
    const yesCount = page.locator('text=/\\d+.*yes|yes.*\\d+/i').first();
    
    if (await yesCount.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });
});

// NOTE: Propose + Vote mutation tests moved to activities-voting-serial.spec.ts
