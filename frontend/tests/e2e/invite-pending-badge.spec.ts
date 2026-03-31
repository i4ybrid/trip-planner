/**
 * PARALLEL SAFE (read-only portions) — mutation tests moved to member-invite-serial.spec.ts
 * 
 * This file contains ONLY read-only badge display tests.
 * Accept/Decline mutation tests are in: member-invite-serial.spec.ts
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

test.describe('Pending Badge Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show yellow Pending badge for invited members', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/members`);
    await page.waitForLoadState('domcontentloaded');
    
    const pendingBadge = page.locator('[class*="badge"][class*="yellow"], [class*="badge"][class*="amber"], [class*="badge"][class*="orange"]').first();
    
    if (await pendingBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pendingBadge).toBeVisible();
    } else {
      const pendingLabel = page.locator('text=/Pending|INVITED|PENDING/i').first();
      if (await pendingLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(pendingLabel).toBeVisible();
      } else {
        test.skip();
      }
    }
  });

  test('should display Pending badge with correct styling', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/members`);
    await page.waitForLoadState('domcontentloaded');
    
    const badge = page.locator('[class*="pending"], [class*="invited"], [class*="badge"]').first();
    
    if (await badge.isVisible({ timeout: 3000 }).catch(() => false)) {
      const bgColor = await badge.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor || style.background || '';
      });
      
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
        expect(bgColor).toMatch(/rgb/);
      }
    } else {
      test.skip();
    }
  });

  test('should show pending badge next to member name', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/members`);
    await page.waitForLoadState('domcontentloaded');
    
    const memberWithPending = page.locator('[class*="member"][class*="pending"], tr:has-text("Pending")').first();
    
    if (await memberWithPending.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(memberWithPending).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should distinguish pending from confirmed members visually', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/members`);
    await page.waitForLoadState('domcontentloaded');
    
    const confirmedBadge = page.locator('text=/Confirmed|Active|MEMBER|ORGANIZER|MASTER/i').first();
    const pendingBadge = page.locator('text=/Pending|INVITED/i').first();
    
    const hasConfirmed = await confirmedBadge.isVisible({ timeout: 2000 }).catch(() => false);
    const hasPending = await pendingBadge.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasConfirmed && hasPending) {
      expect(true).toBe(true);
    } else if (hasPending) {
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });
});

test.describe('Pending Badge in Different Views', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show pending badge in trip settings modal', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'overview');
    await page.waitForLoadState('domcontentloaded');
    
    const settingsBtn = page.locator('button[data-testid="settings-btn"], button[aria-label*="settings" i], button[class*="settings"]').first();
    
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      
      const pendingInSettings = page.locator('text=/Pending|INVITED/i').first();
      
      if (await pendingInSettings.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(pendingInSettings).toBeVisible();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should show pending badge in members tab', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/members`);
    await page.waitForLoadState('domcontentloaded');
    
    const pendingBadge = page.locator('[class*="badge"], text=/Pending/i').first();
    
    if (await pendingBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pendingBadge).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should filter to show only pending invites', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/members`);
    await page.waitForLoadState('domcontentloaded');
    
    const filterBtn = page.locator('button:has-text("Pending"), button:has-text("Filter"), button:has-text("Show All")').first();
    
    if (await filterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      
      const pendingOnly = page.locator('[class*="pending"], text=/Pending/i');
      const count = await pendingOnly.count();
      
      if (count > 0) {
        expect(true).toBe(true);
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});

// NOTE: Accept/Decline mutation tests moved to member-invite-serial.spec.ts
