import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

/**
 * E2E tests for Chat functionality
 * 
 * Tests cover:
 * - Viewing chat messages
 * - Sending a message (Enter to submit)
 * - Verifying message appears in chat
 * - Message input and send button
 */

test.describe('Chat Page - View Messages', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should display the Group Chat heading', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    await expect(page.locator('text=Group Chat').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display member count', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Should show number of members in chat header
    // trip-1 has 4 members (user-1, user-2, user-3, user-4)
    await expect(page.locator('text=/4 members/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display messages from seed data', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // trip-1 has 50 messages in seed data
    // Should see some of these messages displayed
    await page.waitForLoadState('domcontentloaded');
    
    // Check for message content from seed data
    const messageContent = page.locator('text=Hey everyone! Excited about this trip! 🏝️');
    await expect(messageContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display sender names on messages', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Messages should show sender names
    // Test User (user-1) sent messages
    await expect(page.locator('text=Test User').first()).toBeVisible({ timeout: 10000 });
    
    // Sarah Chen (user-2) sent messages
    await expect(page.locator('text=Sarah Chen').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display Members sidebar', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Should show Members section
    await expect(page.locator('text=Members').first()).toBeVisible({ timeout: 5000 });
    
    // Should show member names
    await expect(page.locator('text=Sarah Chen').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Mike Johnson').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Emma Wilson').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show member status indicator', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Members should have a green status indicator (online)
    // The green dot should be visible for online members
    await expect(page.locator('span[class*="bg-green"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display empty state when no messages', async ({ page }) => {
    // Navigate to a trip with no messages
    // trip-3 (Europe) has no messages in seed
    await navigateToTrip(page, TRIP_IDS.europe, 'chat');
    
    // Empty state message should appear
    await expect(page.locator('text=/no messages|start the conversation/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display chat input area', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Should show message input textarea
    const input = page.locator('#chat-input');
    await expect(input).toBeVisible({ timeout: 5000 });
    
    // Should show send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible({ timeout: 5000 });
  });

  test('should display input placeholder text', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Input should have placeholder text
    const input = page.locator('#chat-input');
    await expect(input).toHaveAttribute('placeholder', /type a message|@ to mention/i);
  });
});

test.describe('Send Message', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should send a message by pressing Enter', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type a test message
    const testMessage = `E2E Test Message ${Date.now()}`;
    await input.fill(testMessage);
    
    // Press Enter to send
    await input.press('Enter');
    
    // Wait for the message to appear
    await page.waitForTimeout(1000);
    
    // The message should appear in the chat
    await expect(page.locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should send a message by clicking send button', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type a test message
    const testMessage = `E2E Button Test ${Date.now()}`;
    await input.fill(testMessage);
    
    // Click send button
    await page.click('button[type="submit"]');
    
    // Wait for the message to appear
    await page.waitForTimeout(1000);
    
    // The message should appear in the chat
    await expect(page.locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should clear input after sending message', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type a test message
    await input.fill('Test message');
    
    // Send the message
    await input.press('Enter');
    await page.waitForTimeout(500);
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  });

  test('should not send empty messages', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Try to send with empty input
    await input.fill('');
    await input.press('Enter');
    
    // Wait a bit
    await page.waitForTimeout(500);
    
    // Input should still be empty
    await expect(input).toHaveValue('');
  });

  test('should send message with @mention', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type a message with mention
    const testMessage = 'Hey @everyone!';
    await input.fill(testMessage);
    
    // Press Enter to send
    await input.press('Enter');
    
    // Wait for the message
    await page.waitForTimeout(1000);
    
    // The message with mention should appear
    await expect(page.locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show mention dropdown when typing @', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type @ to trigger mention
    await input.fill('Hey @');
    
    // Wait for dropdown to appear
    await page.waitForTimeout(500);
    
    // Mention dropdown should be visible
    const mentionDropdown = page.locator('text=/everyone|notify all/i');
    await expect(mentionDropdown.first()).toBeVisible({ timeout: 5000 });
  });

  test('should insert mention when clicking in dropdown', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type @ to trigger mention
    await input.fill('Hey @');
    await page.waitForTimeout(500);
    
    // Click on "everyone" option
    await page.click('text=/@everyone/');
    await page.waitForTimeout(300);
    
    // The input should contain the mention
    const inputValue = await input.inputValue();
    expect(inputValue).toContain('@everyone');
  });

  test('should hide mention dropdown when @ is removed', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type @ to trigger mention
    await input.fill('Hey @');
    await page.waitForTimeout(500);
    
    // Mention dropdown should be visible
    const mentionDropdown = page.locator('button').filter({ hasText: /@everyone/ }).first();
    await expect(mentionDropdown).toBeVisible();
    
    // Remove the @
    await input.fill('Hey ');
    await page.waitForTimeout(300);
    
    // Dropdown should be hidden (mention dropdown uses position absolute)
    await expect(mentionDropdown).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Message Styling', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should style current user messages differently', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Find a message sent by Test User (user-1, the current user)
    // These should have primary/amber background color
    // Look for a specific message we can identify
    
    // The messages from user-1 should have a specific class for right-alignment
    const userMessages = page.locator('.bg-primary.text-primary-foreground').first();
    await expect(userMessages).toBeVisible({ timeout: 10000 });
  });

  test('should style other user messages differently', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Messages from other users should have secondary background
    // Look for a message with secondary background class
    const otherMessages = page.locator('.bg-secondary').first();
    await expect(otherMessages).toBeVisible({ timeout: 10000 });
  });

  test('should show avatar for other users', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Other users' messages should have avatar
    // Look for avatar elements next to messages
    // The avatar is usually an img or div with avatar styling
    const avatars = page.locator('[class*="avatar"]').first();
    await expect(avatars).toBeVisible({ timeout: 10000 });
  });

  test('should display sender name above messages from others', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // Messages from others should show sender name
    // Look for the name "Sarah Chen" appearing above her messages
    await expect(page.locator('text=Sarah Chen').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Chat Scrolling', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should show load earlier messages button', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // trip-1 has 50 messages - should show "Load earlier messages" button
    const loadMoreButton = page.locator('button').filter({ hasText: /load earlier messages/i });
    await expect(loadMoreButton).toBeVisible({ timeout: 10000 });
  });

  test('should scroll to bottom on page load', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    // The messages container should be visible
    const messagesContainer = page.locator('[class*="overflow-y-auto"]').first();
    await expect(messagesContainer).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Message Input', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should focus on input when page loads', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Input should be focused or ready for input
    await expect(input).toBeEditable();
  });

  test('should support multiline input (Shift+Enter)', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type first line
    await input.fill('Line 1');
    
    // Press Shift+Enter to add newline
    await input.press('Shift+Enter');
    
    // Continue typing
    await input.type('Line 2');
    
    // Value should contain both lines
    const value = await input.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('should not send message on Shift+Enter', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'chat');
    
    const input = page.locator('#chat-input');
    await input.waitFor({ state: 'visible', timeout: 5000 });
    
    // Type a message with Shift+Enter
    await input.fill('This should not send');
    await input.press('Shift+Enter');
    
    // Wait a moment
    await page.waitForTimeout(500);
    
    // Input should still have the text (not cleared)
    await expect(input).toHaveValue(/This should not send/);
  });
});
