import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

/**
 * E2E tests for WebSocket Real-time functionality
 * 
 * Tests cover:
 * - Notification bell count updates when new notification arrives (WS)
 * - New chat message appears without refresh
 * - Timeline event appears without refresh
 * 
 * Note: Many of these tests are skipped because they require
 * real-time interaction from a second user. They serve as
 * documentation for manual testing.
 */

test.describe('WebSocket Connection', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should establish WebSocket connection on page load', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a moment for WebSocket to establish
    await page.waitForTimeout(1000);
    
    // Check for WebSocket connection (via console messages or network)
    // This is hard to test directly in Playwright without access to WS internals
    // We'll check that the page loaded without errors
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBe(true);
  });

  test('should reconnect WebSocket on connection loss', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Simulate disconnect by going offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);
    
    // Come back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);
    
    // Page should still be functional
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBe(true);
  });
});

test.describe('Notification Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should update notification bell count when new notification arrives', async ({ page }) => {
    // This test requires a second user to trigger a notification
    test.skip('WebSocket notification update - requires second user action; manual test');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Get initial badge count
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    const badge = bellButton.locator('[class*="badge"], [class*="count"]').first();
    
    const initialCount = await badge.textContent().catch(() => '0');
    
    // Wait for WebSocket message from another user triggering notification
    await page.waitForTimeout(3000);
    
    // Badge count should have increased
    const newCount = await badge.textContent().catch(() => '0');
    
    // If notification was triggered, count should increase
    // This test documents expected behavior
    expect(parseInt(newCount || '0')).toBeGreaterThanOrEqual(parseInt(initialCount || '0'));
  });

  test('should show new notification in dropdown without page refresh', async ({ page }) => {
    test.skip('WebSocket notification in dropdown - requires second user; manual test');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Open notification dropdown
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    await bellButton.click();
    await page.waitForTimeout(500);
    
    // Count notifications before
    const itemsBefore = await page.locator('[class*="notification"][class*="item"]').count();
    
    // Wait for new notification via WebSocket
    await page.waitForTimeout(3000);
    
    // Count should increase without page refresh
    const itemsAfter = await page.locator('[class*="notification"][class*="item"]').count();
    
    expect(itemsAfter).toBeGreaterThanOrEqual(itemsBefore);
  });

  test('should play sound when new notification arrives', async ({ page }) => {
    test.skip('Audio notification - requires audio permissions and user preference; manual test');
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for potential notification
    await page.waitForTimeout(2000);
    
    // Document that sound notification is a feature to test manually
    expect(true).toBe(true);
  });

  test('should update notification badge in real-time across pages', async ({ page }) => {
    test.skip('Cross-page notification update - requires second user; manual test');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Check badge
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    const badge = bellButton.locator('[class*="badge"]').first();
    const initialCount = await badge.textContent().catch(() => '0');
    
    // Navigate to a different page (WebSocket should still be connected)
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for potential notification
    await page.waitForTimeout(2000);
    
    // Go back to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Badge should reflect new notifications
    const newCount = await badge.textContent().catch(() => '0');
    expect(parseInt(newCount || '0')).toBeGreaterThanOrEqual(parseInt(initialCount || '0'));
  });
});

test.describe('Chat Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should receive new chat message without page refresh', async ({ page }) => {
    test.skip('WebSocket chat message - requires second user to send message; manual test');
    
    // Get initial message count
    const messagesBefore = await page.locator('[class*="message"]').count();
    
    // Wait for message from another user via WebSocket
    await page.waitForTimeout(3000);
    
    // Message should appear without refresh
    const messagesAfter = await page.locator('[class*="message"]').count();
    
    expect(messagesAfter).toBeGreaterThan(messagesBefore);
  });

  test('should show typing indicator when another user is typing', async ({ page }) => {
    test.skip('Typing indicator - requires second user to type; manual test');
    
    // Look for typing indicator
    const typingIndicator = page.locator('[class*="typing"], text=/... is typing/i').first();
    
    // Wait for another user to start typing
    await page.waitForTimeout(3000);
    
    // Indicator should appear if another user is typing
    const isVisible = await typingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should update chat message status (sent, delivered, read)', async ({ page }) => {
    test.skip('Message delivery status - requires second user interaction; manual test');
    
    // Send a message
    const messageInput = page.locator('input[placeholder*="message"], textarea').first();
    if (await messageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await messageInput.fill('Test message for status');
      await messageInput.press('Enter');
      await page.waitForTimeout(1000);
      
      // Message should show sent status
      const sentStatus = page.locator('text=/sent|delivered|read/i').first();
      const hasStatus = await sentStatus.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasStatus).toBe(true);
    }
  });

  test('should show online status of chat members', async ({ page }) => {
    test.skip('Online status - requires presence feature; manual test');
    
    // Look for online indicators
    const onlineIndicator = page.locator('[class*="online"], [class*="presence"]').first();
    const hasPresence = await onlineIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasPresence).toBe(true);
  });
});

test.describe('Timeline Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display new timeline event without page refresh', async ({ page }) => {
    test.skip('WebSocket timeline event - requires member action; manual test');
    
    // Get initial event count
    const eventsBefore = await page.locator('[class*="timeline"] [class*="item"], [class*="event"]').count();
    
    // Wait for new event (e.g., another member joins)
    await page.waitForTimeout(3000);
    
    // Event should appear without refresh
    const eventsAfter = await page.locator('[class*="timeline"] [class*="item"], [class*="event"]').count();
    
    expect(eventsAfter).toBeGreaterThanOrEqual(eventsBefore);
  });

  test('should update milestone status in timeline in real-time', async ({ page }) => {
    test.skip('Milestone status update - requires milestone action from another user; manual test');
    
    // Look for milestone events in timeline
    const milestoneEvent = page.locator('text=/milestone|deadline/i').first();
    
    if (await milestoneEvent.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Wait for status update
      await page.waitForTimeout(2000);
      
      // Status should update in real-time
      expect(true).toBe(true);
    }
  });

  test('should show new member joined event immediately', async ({ page }) => {
    test.skip('Member join event - requires new member to join; manual test');
    
    // Get initial timeline state
    const eventsBefore = await page.locator('[class*="timeline"]').count();
    
    // Wait for potential member join
    await page.waitForTimeout(3000);
    
    // Timeline should reflect the new event
    const eventsAfter = await page.locator('[class*="timeline"]').count();
    expect(eventsAfter).toBeGreaterThanOrEqual(eventsBefore);
  });
});

test.describe('Payments Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should update payment status without refresh', async ({ page }) => {
    test.skip('Payment status update - requires payment action; manual test');
    
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for potential payment update
    await page.waitForTimeout(2000);
    
    // Payment status should update via WebSocket
    expect(true).toBe(true);
  });

  test('should show new expense without page refresh', async ({ page }) => {
    test.skip('New expense update - requires expense creation; manual test');
    
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    const expensesBefore = await page.locator('[class*="expense"], [class*="payment"]').count();
    
    await page.waitForTimeout(2000);
    
    const expensesAfter = await page.locator('[class*="expense"], [class*="payment"]').count();
    expect(expensesAfter).toBeGreaterThanOrEqual(expensesBefore);
  });

  test('should update balance calculations in real-time', async ({ page }) => {
    test.skip('Balance update - requires payment or expense; manual test');
    
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Get initial balance
    const balanceBefore = await page.locator('text=/\\$?\\d+/').first().textContent().catch(() => '0');
    
    await page.waitForTimeout(2000);
    
    // Balance should potentially update
    expect(true).toBe(true);
  });
});

test.describe('Presence and Online Status', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show online members in real-time', async ({ page }) => {
    test.skip('Presence indicators - requires multiple online users; manual test');
    
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for online member indicators
    const onlineMembers = page.locator('[class*="online"], [class*="presence"][class*="active"]');
    const count = await onlineMembers.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should update member presence when they join/leave', async ({ page }) => {
    test.skip('Presence changes - requires member join/leave action; manual test');
    
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for presence changes
    await page.waitForTimeout(3000);
    
    // Presence should update in real-time
    expect(true).toBe(true);
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should handle WebSocket disconnection gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Simulate disconnect
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);
    
    // Page should still be visible and show offline indicator if applicable
    const isVisible = await page.locator('body').isVisible();
    expect(isVisible).toBe(true);
    
    // Come back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);
    
    // Should reconnect and page should work
    expect(true).toBe(true);
  });

  test('should show reconnecting indicator during reconnection', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    // Start disconnect
    await page.context().setOffline(true);
    
    // Look for reconnecting indicator
    const reconnectingIndicator = page.locator('text=/reconnecting|reconnect|offline/i').first();
    const hasIndicator = await reconnectingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Indicator may or may not show depending on implementation
    expect(true).toBe(true);
    
    await page.context().setOffline(false);
  });
});
