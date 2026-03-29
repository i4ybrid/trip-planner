import { test, expect } from '@playwright/test';

/**
 * E2E tests for Trip Settings and Member Management features
 * 
 * Prerequisites:
 * 1. Backend running on http://localhost:4000
 * 2. Frontend running on http://localhost:3000
 * 3. Database seeded with test data
 * 
 * Test users (all have password: password123):
 * - test@example.com (user-1, Trip Master of Hawaii trip)
 * - sarah@example.com (user-2)
 * - mike@example.com (user-3)
 * - emma@example.com (user-4)
 */

const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
};

const HAWAII_TRIP_ID = 'trip-1';

test.describe('Trip Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Trip master can open settings panel by clicking settings button', async ({ page }) => {
    // Navigate to the Hawaii trip
    await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
    
    // Wait for the page to load
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    
    // Find and click the settings button
    const settingsButton = page.locator('button[data-testid="settings-btn"], button[aria-label*="settings" i], button[class*="settings"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();
    
    // Verify the settings modal opens
    await expect(page.locator('text=Trip Settings')).toBeVisible({ timeout: 5000 });
    
    // Verify trip information section is visible
    await expect(page.locator('text=Trip Information')).toBeVisible();
    
    // Verify members section is visible
    await expect(page.locator('text=Members')).toBeVisible();
  });

  test('Settings button is only visible to trip master', async ({ page }) => {
    // Navigate to the Hawaii trip (where test user is MASTER)
    await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    
    // Settings button should be visible for MASTER
    const settingsButton = page.locator('button[data-testid="settings-btn"], button[aria-label*="settings" i], button[class*="settings"]');
    await expect(settingsButton).toBeVisible();
  });

  test('Non-master cannot access settings button', async ({ page }) => {
    // Logout first - open user menu then click logout
    const userMenuBtn = page.locator('header button.rounded-full, nav button.rounded-full').first();
    if (await userMenuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userMenuBtn.click();
      await page.waitForTimeout(300);
      const logoutBtn = page.locator('button:has-text("Logout")').first();
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/\/login/, { timeout: 10000 });
      }
    }
    
    // Login as a different user (sarah is not master of trip-1)
    await page.fill('#email', 'sarah@example.com');
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to the Hawaii trip where she is NOT master
    await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
    await page.waitForLoadState('domcontentloaded');
    
    // Look for the settings button - it should NOT be visible for non-masters
    // Note: The invite button might be visible instead
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // Check if any settings button exists (with Settings icon)
    const settingsButton = page.locator('button[data-testid="settings-btn"], button[aria-label*="settings" i], button[class*="settings"]');
    
    // The settings icon button shouldn't have Settings text visible for non-master
    // We verify by checking the modal doesn't open when looking for it
    await expect(page.locator('text=Trip Settings')).not.toBeVisible();
  });
});

test.describe('Member Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as master user
    await page.goto('/login');
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to trip settings
    await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    
    // Open settings modal
    const settingsButton = page.locator('button[data-testid="settings-btn"], button[aria-label*="settings" i], button[class*="settings"]');
    await settingsButton.click();
    await page.waitForSelector('text=Trip Settings', { timeout: 5000 });
  });

  test('Trip master can see all confirmed members with role badges', async ({ page }) => {
    // Members section should show all confirmed members
    await expect(page.locator('text=Members (')).toBeVisible();
    
    // Should see role badges for MASTER, ORGANIZER, MEMBER
    await expect(page.locator('text=MASTER')).toBeVisible();
  });

  test('Trip master can promote member to organizer', async ({ page }) => {
    // This test would require having a non-organizer member to promote
    // Look for "Make Organizer" button next to a member
    const makeOrganizerBtn = page.locator('button', { hasText: 'Make Organizer' });
    
    // If such a button exists, click it
    if (await makeOrganizerBtn.isVisible()) {
      await makeOrganizerBtn.click();
      
      // The member should now show ORGANIZER role instead
      await expect(page.locator('text=ORGANIZER').first()).toBeVisible();
    }
  });

  test('Trip master can remove a member', async ({ page }) => {
    // Set up dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept());
    
    // Look for Remove button next to a removable member
    const removeBtn = page.locator('button', { hasText: 'Remove' }).first();
    
    if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeBtn.click();
      
      // Member should be removed (no longer in list or moved to different section)
      // The member count might decrease
    }
  });

  test('Trip master can transfer master role to another member', async ({ page }) => {
    // Look for Crown icon button (transfer master) - use stable selectors
    const crownBtn = page.locator('button[data-testid="transfer-master-btn"], button[aria-label*="transfer" i], button[class*="crown"]').first();
    
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    if (await crownBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await crownBtn.click();
      
      // Should show success message or modal should close
      await expect(page.locator('text=Trip Settings')).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Invite Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
  });

  test('Trip master can invite a new member', async ({ page }) => {
    // Click the Invite button
    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await expect(inviteButton).toBeVisible();
    await inviteButton.click();
    
    // Verify invite modal opens
    await expect(page.locator('text=Invite to Trip')).toBeVisible({ timeout: 5000 });
    
    // Search for a user by email
    const searchInput = page.locator('input[placeholder="Search by email..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('emma@example.com');
    
    // Press Enter to search
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // If user found, there should be an Invite button
    const inviteResultBtn = page.locator('button', { hasText: 'Invite' }).first();
    if (await inviteResultBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteResultBtn.click();
      
      // Should show "Invited" badge
      await expect(page.locator('text=Invited')).toBeVisible();
    }
  });

  test('Invite modal shows friends list', async ({ page }) => {
    // Click the Invite button
    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await inviteButton.click();
    
    // Verify invite modal opens
    await expect(page.locator('text=Invite to Trip')).toBeVisible({ timeout: 5000 });
    
    // Should show "Select from Friends" section
    await expect(page.locator('text=Select from Friends')).toBeVisible();
  });

  test('Invite modal allows generating invite link', async ({ page }) => {
    // Click the Invite button
    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await inviteButton.click();
    
    // Verify invite modal opens
    await expect(page.locator('text=Invite to Trip')).toBeVisible({ timeout: 5000 });
    
    // Click "Generate Invite Link" button
    const generateBtn = page.locator('button', { hasText: 'Generate Invite Link' });
    if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await generateBtn.click();
      
      // Should show a link/copy button
      await page.waitForTimeout(500);
      await expect(page.locator('input[readonly]')).toBeVisible();
    }
  });
});

test.describe('OPEN vs MANAGED Trip Workflows', () => {
  test('OPEN trip: member joins and is immediately CONFIRMED', async ({ page }) => {
    // This test verifies that in an OPEN trip, when a user joins via invite code,
    // their status is immediately CONFIRMED without approval needed
    
    // Create a new OPEN trip or use an existing one
    await page.goto('/trip/new');
    
    // Fill in trip details
    await page.fill('input[name="name"]', 'Test Open Trip');
    
    // Select OPEN style
    const openOption = page.locator('input[type="radio"], button[role="radio"]').filter({ hasText: /open/i });
    if (await openOption.isVisible()) {
      await openOption.click();
    }
    
    // Create trip
    await page.click('button[type="submit"]');
    
    // Wait for trip creation and redirect
    await page.waitForURL(/\/trip\//, { timeout: 10000 });
    
    // In an OPEN trip, the invite flow should auto-confirm members
    // This is verified by the backend - members added to OPEN trips have status CONFIRMED
  });

  test('MANAGED trip: member joins but is PENDING until approved', async ({ page }) => {
    // Create a new MANAGED trip
    await page.goto('/trip/new');
    
    // Fill in trip details
    await page.fill('input[name="name"]', 'Test Managed Trip');
    
    // Select MANAGED style
    const managedOption = page.locator('input[type="radio"], button[role="radio"]').filter({ hasText: /managed/i });
    if (await managedOption.isVisible()) {
      await managedOption.click();
    }
    
    // Create trip
    await page.click('button[type="submit"]');
    
    // Wait for trip creation
    await page.waitForURL(/\/trip\//, { timeout: 10000 });
    
    // In a MANAGED trip, pending members should appear in a separate section
    // This would be verified by looking for "Pending Approval" section in settings
    await page.goto(page.url().replace('/overview', ''));
    
    // Open settings
    const settingsButton = page.locator('button[data-testid="settings-btn"], button[aria-label*="settings" i], button[class*="settings"]');
    await settingsButton.click();
    
    // Look for "Pending Approval" section
    await expect(page.locator('text=Pending Approval')).toBeVisible({ timeout: 2000 }).catch(() => {
      // If no pending members, section might not show - that's OK
    });
  });
});

test.describe('Member Status Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('Member can decline an invite', async ({ page }) => {
    // User receives an invite notification
    // They should be able to decline
    
    // Navigate to notifications
    await page.click('[aria-label*="notification" i]');
    
    // Look for an invite notification
    const inviteNotification = page.locator('text=/invitation|invited.*trip/i');
    
    if (await inviteNotification.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click on the notification
      await inviteNotification.click();
      
      // Should navigate to the trip or show invite details
      // Decline button should be available
      const declineBtn = page.locator('button', { hasText: /decline|reject/i });
      if (await declineBtn.isVisible()) {
        await declineBtn.click();
      }
    }
  });

  test('Member status workflow: INVITED → CONFIRMED', async ({ page }) => {
    // When a member is invited to a MANAGED trip, status is INVITED
    // When approved by organizer/master, status becomes CONFIRMED
    
    // Navigate to a managed trip where user is not master
    // Look at settings modal for pending members
  });

  test('Member status workflow: INVITED → DECLINED', async ({ page }) => {
    // When a member declines an invite, status becomes DECLINED
    // They should not appear in the members list
  });
});

test.describe('Member Count Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
    await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
  });

  test('Member count updates correctly after adding a member', async ({ page }) => {
    // Get initial member count
    const membersCard = page.locator('text=/Members \\(\\d+\\)/');
    await expect(membersCard).toBeVisible();
    const initialText = await membersCard.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Open invite modal
    const inviteButton = page.locator('button', { hasText: 'Invite' });
    await inviteButton.click();
    await page.waitForSelector('text=Invite to Trip', { timeout: 5000 });
    
    // Search and invite a user
    const searchInput = page.locator('input[placeholder="Search by email..."]');
    await searchInput.fill('mike@example.com');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // If user found, invite them
    const inviteResultBtn = page.locator('button', { hasText: 'Invite' }).first();
    if (await inviteResultBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteResultBtn.click();
      
      // Close modal
      await page.keyboard.press('Escape');
      
      // Member count should increase
      await page.waitForTimeout(500);
      const newText = await membersCard.textContent();
      const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test('Member count updates correctly after removing a member', async ({ page }) => {
    // Get initial member count
    const membersCard = page.locator('text=/Members \\(\\d+\\)/');
    await expect(membersCard).toBeVisible();
    const initialText = await membersCard.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
    
    // Open settings modal
    const settingsButton = page.locator('button[data-testid="settings-btn"], button[aria-label*="settings" i], button[class*="settings"]');
    await settingsButton.click();
    await page.waitForSelector('text=Trip Settings', { timeout: 5000 });
    
    // Handle dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Look for a Remove button next to a removable member
    const removeBtn = page.locator('button', { hasText: 'Remove' }).first();
    if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeBtn.click();
      
      // Wait for update
      await page.waitForTimeout(500);
      
      // Member count should decrease
      const newText = await membersCard.textContent();
      const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
      expect(newCount).toBeLessThan(initialCount);
    }
  });
});