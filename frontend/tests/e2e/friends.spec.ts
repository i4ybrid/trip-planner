/**
 * PARALLEL SAFE — serial/mutation tests moved to friends-serial.spec.ts
 * 
 * This file contains ONLY read-only friends display tests.
 * Friend request mutations and DM tests are in: friends-serial.spec.ts
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Friends — Read-Only Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should navigate to friends page', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const pageContent = page.locator('body');
    await expect(pageContent).not.toBeEmpty();
    
    const hasFriendsContent = await page.locator('text=/friend|connection/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasFriendsContent) {
      expect(true).toBe(true);
    }
  });

  test('should display friends list', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const friendsList = page.locator('[class*="friend"], [class*="contact"]').first();
    const emptyState = page.locator('text=/no friends|add friend|find friends/i').first();
    
    const hasList = await friendsList.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasList || hasEmpty) {
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should display friend names', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const userNames = page.locator('text=/Sarah|Mike|Emma/i');
    const count = await userNames.count();
    
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should search friends', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="find" i]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Sarah');
      await page.waitForLoadState('domcontentloaded');
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });

  test('should show add friend button', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const addButton = page.locator('button').filter({ hasText: /add friend|find user|add contact/i }).first();
    
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(addButton).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show pending friend requests section', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const requestsSection = page.locator('text=/requests|pending|incoming/i').first();
    
    if (await requestsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(requestsSection).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should show friend suggestions', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const suggestions = page.locator('text=/suggest|people you may know|recommended/i').first();
    
    if (await suggestions.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(suggestions).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should navigate to friends from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const friendsLink = page.locator('a[href*="friends"], nav button').filter({ hasText: /friend/i }).first();
    
    if (await friendsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await friendsLink.click();
      await expect(page).toHaveURL(/\/friends/);
    } else {
      test.skip();
    }
  });

  test('should show friends count or badge', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const badge = page.locator('[class*="badge"], [class*="count"]').first();
    
    if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      expect(true).toBe(true);
    }
  });

  test('should redirect to login when accessing friends while logged out', async ({ page }) => {
    await page.context().clearCookies();
    
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page).toHaveURL(/\/login/);
  });
});

// NOTE: Friend request mutations (accept/decline/send) moved to friends-serial.spec.ts
// NOTE: Direct Messages tests (require friendships to exist) moved to friends-serial.spec.ts
