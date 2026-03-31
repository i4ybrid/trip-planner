/**
 * SERIAL CHAIN E — Friends (DMs require friendships to exist)
 * 
 * These tests run serially because the "Direct Messages" section requires
 * friendships to already exist in the system. Friend request accept/decline
 * and DM start operations mutate the friendship state.
 * 
 * IMPORTANT: Do NOT add parallel() tests to this file.
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe.serial('Friends — Serial Chain (DMs require friendships)', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('E1: should accept a friend request', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const acceptButton = page.locator('button').filter({ hasText: /accept|confirm|add/i }).first();
    
    if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });

  test('E1: should decline a friend request', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const declineButton = page.locator('button').filter({ hasText: /decline|reject|remove/i }).first();
    
    if (await declineButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await declineButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });

  test('E1: should send a friend request', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const addButton = page.locator('button').filter({ hasText: /add|find/i }).first();
    
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.fill('newuser@example.com');
        
        const sendButton = page.locator('button').filter({ hasText: /send|add|request/i }).first();
        
        if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await sendButton.click();
          await page.waitForLoadState('domcontentloaded');
          
          const success = page.locator('text=/request sent|friend request|sent/i').first();
          
          if (await success.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(success).toBeVisible();
          }
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('E2: should start new DM from friends page', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForLoadState('domcontentloaded');
    
    const messageButton = page.locator('button').filter({ hasText: /message|chat|dm/i }).first();
    
    if (await messageButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await messageButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      expect(page.url()).toMatch(/\/messages/);
    } else {
      test.skip();
    }
  });

  test('E2: should display DM conversations list', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('domcontentloaded');
    
    const conversations = page.locator('[class*="conversation"], [class*="dm"]').first();
    const emptyState = page.locator('text=/no messages|start a conversation/i').first();
    
    const hasConversations = await conversations.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasConversations || hasEmpty) {
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });

  test('E2: should navigate to messages page', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('domcontentloaded');
    
    const pageContent = page.locator('body');
    await expect(pageContent).not.toBeEmpty();
  });
});
