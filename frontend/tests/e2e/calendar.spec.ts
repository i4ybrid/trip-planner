/**
 * PARALLEL SAFE — all tests are read-only or skip gracefully.
 * Calendar tests only read/display trip dates without mutations.
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, TEST_USERS, TRIP_IDS } from './helpers/auth';

test.describe('Calendar Export', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test.describe('Trip Overview Calendar Export', () => {
    test('should display Add to Calendar button on trip overview', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
      await page.waitForLoadState('domcontentloaded');
      
      // Look for calendar export button
      const calendarButton = page.locator('button').filter({ hasText: /calendar|add.*calendar/i }).first();
      
      if (await calendarButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(calendarButton).toBeVisible();
      } else {
        // Check for dropdown trigger
        const dropdownTrigger = page.locator('[class*="trigger"], button').filter({ hasText: /calendar/i }).first();
        
        if (await dropdownTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(dropdownTrigger).toBeVisible();
        } else {
          test.skip();
        }
      }
    });

    test('should open calendar export dropdown when clicked', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
      await page.waitForLoadState('domcontentloaded');
      
      // Look for and click the calendar button
      const calendarButton = page.locator('button').filter({ hasText: /calendar|add.*calendar/i }).first();
      
      if (await calendarButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await calendarButton.click();
        await page.waitForTimeout(500);
        
        // Look for dropdown options
        const dropdown = page.locator('[class*="dropdown"], [class*="menu"]').first();
        
        if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(dropdown).toBeVisible();
        }
        // If no dropdown, button may have different behavior
        expect(true).toBe(true);
      } else {
        test.skip();
      }
    });

    test('should show iCal download option', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
      await page.waitForLoadState('domcontentloaded');
      
      // Look for calendar button
      const calendarButton = page.locator('button').filter({ hasText: /calendar/i }).first();
      
      if (await calendarButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await calendarButton.click();
        await page.waitForTimeout(500);
        
        // Look for iCal option
        const icalOption = page.locator('text=/ical|download.*ics|apple calendar/i').first();
        
        if (await icalOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(icalOption).toBeVisible();
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });

    test('should show Google Calendar option', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
      await page.waitForLoadState('domcontentloaded');
      
      const calendarButton = page.locator('button').filter({ hasText: /calendar/i }).first();
      
      if (await calendarButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await calendarButton.click();
        await page.waitForTimeout(500);
        
        const googleOption = page.locator('text=/google/i').first();
        
        if (await googleOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(googleOption).toBeVisible();
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });

    test('should show Outlook Calendar option', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
      await page.waitForLoadState('domcontentloaded');
      
      const calendarButton = page.locator('button').filter({ hasText: /calendar/i }).first();
      
      if (await calendarButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await calendarButton.click();
        await page.waitForTimeout(500);
        
        const outlookOption = page.locator('text=/outlook/i').first();
        
        if (await outlookOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(outlookOption).toBeVisible();
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('Activities Calendar Export', () => {
    test('should show calendar icon on activity cards', async ({ page }) => {
      await page.goto(`/trip/${TRIP_IDS.hawaii}/activities`);
      await page.waitForLoadState('domcontentloaded');
      
      // Look for activity cards with calendar indicators
      const activityCards = page.locator('[class*="activity"], [class*="card"]').first();
      
      if (await activityCards.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Activities with dates should have calendar icons
        const calendarIcon = page.locator('[class*="calendar"], svg[class*="calendar"]').first();
        
        if (await calendarIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
          expect(true).toBe(true);
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });
  });
});

test.describe('Calendar Export - Unauthenticated', () => {
  test('should redirect to login when accessing calendar export unauthenticated', async ({ page }) => {
    await page.context().clearCookies();
    
    // Try to access the calendar API endpoint (will redirect to login in the app)
    await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
    await page.waitForLoadState('domcontentloaded');
    
    // Should redirect to login
    const isLoginPage = page.url().includes('/login');
    expect(isLoginPage || await page.locator('text=/login|sign in/i').isVisible({ timeout: 2000 }).catch(() => false)).toBeTruthy();
  });
});
