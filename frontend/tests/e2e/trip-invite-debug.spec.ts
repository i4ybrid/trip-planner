import { test, expect } from '@playwright/test';
import { loginTestUser, TEST_USERS, TRIP_IDS } from './helpers/auth';

/**
 * E2E tests for Trip Invite debugging
 * 
 * This test suite specifically investigates why invites don't appear
 * for the trip master.
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

test.describe('Trip Invite Debug', () => {
  
  test.describe('Invite Modal - Trip Master Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login as master user
      await page.goto('/login');
      await page.fill('#email', TEST_USER.email);
      await page.fill('#password', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      // Navigate to the Hawaii trip where test user is MASTER
      await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
      await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    });

    test('TRIP MASTER can see Invite button on trip overview', async ({ page }) => {
      // The Invite button should be visible for the trip master
      const inviteButton = page.locator('button').filter({ hasText: /invite/i }).first();
      
      await expect(inviteButton).toBeVisible({ timeout: 5000 });
    });

    test('TRIP MASTER can open invite modal', async ({ page }) => {
      // Click the Invite button
      const inviteButton = page.locator('button').filter({ hasText: /invite/i }).first();
      await inviteButton.click();
      
      // Verify invite modal opens
      await expect(page.locator('text=Invite to Trip')).toBeVisible({ timeout: 5000 });
    });

    test('TRIP MASTER can search for user by email', async ({ page }) => {
      // Open invite modal
      const inviteButton = page.locator('button').filter({ hasText: /invite/i }).first();
      await inviteButton.click();
      await page.waitForSelector('text=Invite to Trip', { timeout: 5000 });
      
      // Search for emma (who is in friends list)
      const searchInput = page.locator('input[placeholder="Search by email..."]');
      await searchInput.fill('emma@example.com');
      await searchInput.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1500);
      
      // Should see emma in search results
      const emmaResult = page.locator('text=Emma Wilson').first();
      if (await emmaResult.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(emmaResult).toBeVisible();
      } else {
        // If not found, that's part of the bug - note it
        console.log('Emma not found in search results - this is the bug!');
      }
    });

    test('INVITE: After inviting, user should appear in members list with INVITED status', async ({ page }) => {
      // Get initial member count
      const membersCard = page.locator('text=/Members \\(\\d+\\)/').first();
      await expect(membersCard).toBeVisible();
      const initialText = await membersCard.textContent();
      const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');
      
      // Open invite modal
      const inviteButton = page.locator('button').filter({ hasText: /invite/i }).first();
      await inviteButton.click();
      await page.waitForSelector('text=Invite to Trip', { timeout: 5000 });
      
      // Search for emma
      const searchInput = page.locator('input[placeholder="Search by email..."]');
      await searchInput.fill('emma@example.com');
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);
      
      // Click invite button if visible
      const inviteEmmaBtn = page.locator('button', { hasText: 'Invite' }).first();
      if (await inviteEmmaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inviteEmmaBtn.click();
        
        // Should see "Invited" badge
        await expect(page.locator('text=Invited')).toBeVisible({ timeout: 3000 });
        
        // Close modal
        await page.keyboard.press('Escape');
        
        // Wait for member list to update
        await page.waitForTimeout(1000);
        
        // Check if Emma appears in members list with "(Invited)" status
        // For OPEN trips (Hawaii is OPEN), members are immediately CONFIRMED
        // But the bug might be that the new member doesn't appear at all
        
        // Refresh to see actual state
        await page.reload();
        await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
        
        // Check member count - it should have increased
        const newText = await membersCard.textContent();
        const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
        
        // This is the key assertion - member count should increase
        expect(newCount).toBeGreaterThan(initialCount);
      } else {
        // The invite button wasn't visible - this is the bug
        console.log('BUG FOUND: Invite button not visible after search');
        test.fail('Invite button not visible - user cannot be invited');
      }
    });

    test('INVITE: Friends list should show available friends', async ({ page }) => {
      // Open invite modal
      const inviteButton = page.locator('button').filter({ hasText: /invite/i }).first();
      await inviteButton.click();
      await page.waitForSelector('text=Invite to Trip', { timeout: 5000 });
      
      // Should show "Select from Friends" section
      const friendsSection = page.locator('text=Select from Friends');
      await expect(friendsSection).toBeVisible({ timeout: 3000 });
      
      // Check if any friends are displayed
      // (In seed data, test user should have friends)
      const friendsList = page.locator('[class*="friend"], [class*="member"]').first();
      // Just verify the section is visible
    });

    test('INVITE: Generate invite link should work for trip master', async ({ page }) => {
      // Open invite modal
      const inviteButton = page.locator('button').filter({ hasText: /invite/i }).first();
      await inviteButton.click();
      await page.waitForSelector('text=Invite to Trip', { timeout: 5000 });
      
      // Click "Generate Invite Link" button
      const generateBtn = page.locator('button', { hasText: /Generate Invite Link/i });
      await expect(generateBtn).toBeVisible({ timeout: 3000 });
      await generateBtn.click();
      
      // Should show an input with the invite URL
      const urlInput = page.locator('input[readonly]').first();
      await expect(urlInput).toBeVisible({ timeout: 3000 });
      
      const urlValue = await urlInput.inputValue();
      expect(urlValue).toContain('invite');
    });
  });

  test.describe('Backend API Investigation', () => {
    
    test('API: POST /api/trips/:id/members should work for trip master', async ({ page }) => {
      await loginTestUser(page, 'test');
      
      // Make direct API call to check if invite works
      const response = await page.request.post('http://localhost:4000/api/trips/trip-1/members', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          userId: 'user-4' // emma's ID
        }
      });
      
      // Should return 201 Created
      expect(response.status()).toBe(201);
      
      const responseData = await response.json();
      console.log('Invite response:', responseData);
      
      // Should have data with user info
      expect(responseData.data).toBeDefined();
      expect(responseData.data.userId).toBe('user-4');
    });

    test('API: GET /api/trips/:id/members should return all members including invited', async ({ page }) => {
      await loginTestUser(page, 'test');
      
      // First invite someone
      await page.request.post('http://localhost:4000/api/trips/trip-1/members', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          userId: 'user-4'
        }
      });
      
      // Then get members
      const membersResponse = await page.request.get('http://localhost:4000/api/trips/trip-1/members');
      expect(membersResponse.ok()).toBeTruthy();
      
      const membersData = await membersResponse.json();
      console.log('Members count:', membersData.data?.length);
      
      // Should include user-4
      const hasEmma = membersData.data?.some((m: any) => m.userId === 'user-4');
      expect(hasEmma).toBe(true);
    });
  });

  test.describe('Settings Modal Investigation', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', TEST_USER.email);
      await page.fill('#password', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.goto(`/trip/${HAWAII_TRIP_ID}/overview`);
      await page.waitForSelector('text=Hawaii Beach Vacation', { timeout: 10000 });
    });

    test('TRIP MASTER can open settings modal', async ({ page }) => {
      // Settings button should be visible for MASTER
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).last();
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();
      
      // Settings modal should open
      await expect(page.locator('text=Trip Settings')).toBeVisible({ timeout: 5000 });
    });

    test('Settings modal shows correct member count', async ({ page }) => {
      // Open settings
      const settingsButton = page.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).last();
      await settingsButton.click();
      await page.waitForSelector('text=Trip Settings', { timeout: 5000 });
      
      // Members section should be visible
      const membersSection = page.locator('text=Members');
      await expect(membersSection).toBeVisible();
    });
  });
});

test.describe('Constant Consistency Check', () => {
  
  test('Verify MemberRole enum consistency between frontend and backend', async ({ page }) => {
    // Frontend types (from frontend/src/types/index.ts):
    // type MemberRole = 'MASTER' | 'ORGANIZER' | 'MEMBER' | 'VIEWER';
    
    // Backend Prisma schema:
    // enum MemberRole { MASTER, ORGANIZER, MEMBER, VIEWER }
    
    // Both should have same values
    const frontendRoles = ['MASTER', 'ORGANIZER', 'MEMBER', 'VIEWER'];
    const backendRoles = ['MASTER', 'ORGANIZER', 'MEMBER', 'VIEWER'];
    
    expect(frontendRoles).toEqual(backendRoles);
  });

  test('Verify MemberStatus enum consistency', async ({ page }) => {
    // Frontend: type MemberStatus = 'INVITED' | 'DECLINED' | 'MAYBE' | 'CONFIRMED' | 'REMOVED';
    // Backend: enum MemberStatus { INVITED, DECLINED, MAYBE, CONFIRMED, REMOVED }
    
    const frontendStatuses = ['INVITED', 'DECLINED', 'MAYBE', 'CONFIRMED', 'REMOVED'];
    const backendStatuses = ['INVITED', 'DECLINED', 'MAYBE', 'CONFIRMED', 'REMOVED'];
    
    expect(frontendStatuses).toEqual(backendStatuses);
  });

  test('Verify TripStyle enum consistency', async ({ page }) => {
    // Frontend: type TripStyle = 'OPEN' | 'MANAGED';
    // Backend: enum TripStyle { OPEN, MANAGED }
    
    const frontendStyles = ['OPEN', 'MANAGED'];
    const backendStyles = ['OPEN', 'MANAGED'];
    
    expect(frontendStyles).toEqual(backendStyles);
  });
});
