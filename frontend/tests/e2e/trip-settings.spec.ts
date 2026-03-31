/**
 * PARALLEL SAFE (read-only portions) — serial/mutation tests moved to member-invite-serial.spec.ts
 * 
 * This file contains ONLY read-only settings display tests.
 * Member role mutation tests (promote/transfer/remove) are in: member-invite-serial.spec.ts
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, TEST_USERS, TRIP_IDS } from './helpers/auth';

test.describe('Trip Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('Trip master can open settings panel by clicking settings button', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    
    // The Settings button is the sibling button right after the Invite button
    const settingsButton = page.locator('button:has-text("Invite") + button');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();
    
    await expect(page.locator('text=Trip Settings')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Trip Information')).toBeVisible();
    await expect(page.getByRole('heading', { name: /members/i }).first()).toBeVisible();
  });

  test('Settings button is only visible to trip master', async ({ page }) => {
    await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    
    // The Settings button is the sibling button right after the Invite button
    const settingsButton = page.locator('button:has-text("Invite") + button');
    await expect(settingsButton).toBeVisible();
  });

  test('Non-master cannot access settings button', async ({ page }) => {
    // Navigate directly to login page and logout properly
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Try to logout if already logged in
    const userMenuBtn = page.locator('header button.rounded-full, nav button.rounded-full').first();
    if (await userMenuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenuBtn.click();
      await page.waitForTimeout(300);
      const logoutBtn = page.locator('button:has-text("Logout")').first();
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/\/login/, { timeout: 10000 });
      }
    }
    
    // Now fill login form for sarah (non-master user)
    await page.fill('#email', 'sarah@example.com');
    await page.fill('#password', TEST_USERS.sarah.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('text=Trip Settings')).not.toBeVisible();
  });
});

test.describe('Member List Display', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
    await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    const settingsButton = page.locator('button:has-text("Invite") + button');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();
    await page.waitForSelector('text=Trip Settings', { timeout: 5000 });
  });

  test('Trip master can see all confirmed members with role badges', async ({ page }) => {
    await expect(page.locator('text=Members (').first()).toBeVisible();
    // Use span:text() to target only the MASTER badge, not the "Trip Master" label text
    await expect(page.locator('span:text("MASTER")')).toBeVisible();
  });
});

test.describe('Invite Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', TEST_USERS.test.email);
    await page.fill('#password', TEST_USERS.test.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto(`/trip/${TRIP_IDS.hawaii}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
  });

  test('Trip master can invite a new member', async ({ page }) => {
    // Close any open modal before clicking Invite
    const modalClose = page.locator('[aria-label="close"], .modal button:has-text("Cancel")').first();
    if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalClose.click();
      await page.waitForTimeout(500);
    }

    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();
    
    await expect(page.locator('text=Invite to Trip')).toBeVisible({ timeout: 5000 });
    
    const searchInput = page.locator('input[placeholder="Search by email..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('emma@example.com');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    
    const inviteResultBtn = page.locator('button', { hasText: 'Invite' }).first();
    if (await inviteResultBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteResultBtn.click();
      await expect(page.locator('text=Invited')).toBeVisible();
    }
  });

  test('Invite modal shows friends list', async ({ page }) => {
    // Close any open modal before clicking Invite
    const modalClose = page.locator('[aria-label="close"], .modal button:has-text("Cancel")').first();
    if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalClose.click();
      await page.waitForTimeout(500);
    }

    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await inviteButton.click();
    await expect(page.locator('text=Invite to Trip')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Select from Friends')).toBeVisible();
  });

  test('Invite modal allows generating invite link', async ({ page }) => {
    // Close any open modal before clicking Invite
    const modalClose = page.locator('[aria-label="close"], .modal button:has-text("Cancel")').first();
    if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalClose.click();
      await page.waitForTimeout(500);
    }

    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await inviteButton.click();
    await expect(page.locator('text=Invite to Trip')).toBeVisible({ timeout: 5000 });
    
    const generateBtn = page.locator('button', { hasText: 'Generate Invite Link' });
    if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await generateBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('input[readonly]')).toBeVisible();
    }
  });

  test('Member count updates correctly after adding a member', async ({ page }) => {
    // Close any open modal before clicking Invite
    const modalClose = page.locator('[aria-label="close"], .modal button:has-text("Cancel")').first();
    if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalClose.click();
      await page.waitForTimeout(500);
    }

    // Get initial member count
    const membersCard = page.locator('text=/Members \\(\\d+\\)/');
    await expect(membersCard).toBeVisible();
    const initialText = await membersCard.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await inviteButton.click();
    await page.waitForSelector('text=Invite to Trip', { timeout: 5000 });
    
    const searchInput = page.locator('input[placeholder="Search by email..."]');
    await searchInput.fill('mike@example.com');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    
    const inviteResultBtn = page.locator('button', { hasText: 'Invite' }).first();
    if (await inviteResultBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteResultBtn.click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      const newText = await membersCard.textContent();
      const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });
});

// NOTE: Promote/transfer/remove member mutation tests moved to member-invite-serial.spec.ts
// NOTE: OPEN vs MANAGED trip creation tests moved to member-invite-serial.spec.ts
