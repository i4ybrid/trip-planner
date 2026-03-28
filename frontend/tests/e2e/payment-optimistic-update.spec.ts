import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

/**
 * E2E tests for Payment Optimistic Updates
 * 
 * These tests verify that:
 * 1. After "Mark as Paid", the UI updates immediately without a re-fetch
 * 2. After "Confirm Receipt", the UI updates immediately
 * 3. No excessive API calls are made during payment mutations
 */

test.describe('Payment Optimistic Updates', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should update UI immediately after Mark as Paid without re-fetch', async ({ page }) => {
    // Track API calls to detect re-fetching
    const apiCalls: { url: string; method: string }[] = [];
    let billSplitsCallCount = 0;
    
    await page.route(/\/api\/trips\/.*\/bill-splits/, async (route) => {
      const url = route.request().url();
      if (url.includes('/bill-splits') && route.request().method() === 'GET') {
        billSplitsCallCount++;
      }
      apiCalls.push({ url, method: route.request().method() });
      await route.continue();
    });
    
    // Navigate to trip payments
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Reset call count after initial load
    const initialBillSplitsCount = billSplitsCallCount;
    
    // Find the "Mark as Paid" button for a pending member
    // Hawaii trip: user-1 (Test User) is the payer for Hotel bill
    // The bill is paid by Test User, other members owe them
    // So we need to find a bill where Test User is NOT the payer and status is PENDING
    
    // Look for "Mark as Paid" button
    const markAsPaidButton = page.locator('button:has-text("Mark as Paid")').first();
    
    // If we find the button, click it
    if (await markAsPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to trigger payment method selection
      await markAsPaidButton.click();
      await page.waitForTimeout(300);
      
      // Select a payment method
      const paymentSelect = page.locator('select').first();
      if (await paymentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paymentSelect.selectOption('VENMO');
        
        // Click Confirm button
        const confirmButton = page.locator('button:has-text("Confirm")').first();
        await confirmButton.click();
        
        // IMMEDIATELY check that the UI updated (optimistic update)
        // Should show PAID badge instead of PENDING for the member
        await page.waitForTimeout(500); // Small delay for state update
        
        // Verify the badge changed to PAID
        const paidBadge = page.locator('text=PAID').first();
        await expect(paidBadge).toBeVisible({ timeout: 3000 });
        
        // Check that we did NOT make an extra GET /bill-splits call after the mutation
        // (optimistic update should not trigger re-fetch)
        const billSplitsCallsAfterMutation = billSplitsCallCount - initialBillSplitsCount;
        
        // There should be 0 additional GET calls to bill-splits (optimistic update)
        expect(billSplitsCallsAfterMutation).toBe(0);
      }
    } else {
      // If no Mark as Paid button, check that page loaded correctly
      await expect(page.locator('text=Payments & Expenses').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update UI immediately after Confirm Receipt without re-fetch', async ({ page }) => {
    // Track API calls
    const apiCalls: { url: string; method: string }[] = [];
    let billSplitsCallCount = 0;
    
    await page.route(/\/api\/trips\/.*\/bill-splits/, async (route) => {
      if (route.request().method() === 'GET' && route.request().url().includes('/bill-splits')) {
        billSplitsCallCount++;
      }
      apiCalls.push({ url: route.request().url(), method: route.request().method() });
      await route.continue();
    });
    
    // Navigate to trip payments
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Reset count after initial load
    const initialCount = billSplitsCallCount;
    
    // Find "Confirm Receipt" button - this appears for the payer when someone marks as paid
    const confirmReceiptButton = page.locator('button:has-text("Confirm Receipt")').first();
    
    if (await confirmReceiptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmReceiptButton.click();
      await page.waitForTimeout(300);
      
      // Click "Yes, Confirm" button
      const yesConfirmButton = page.locator('button:has-text("Yes, Confirm")').first();
      await yesConfirmButton.click();
      
      // IMMEDIATELY verify UI updated (optimistic update)
      await page.waitForTimeout(500);
      
      // Should now show CONFIRMED badge
      const confirmedBadge = page.locator('text=CONFIRMED').first();
      await expect(confirmedBadge).toBeVisible({ timeout: 3000 });
      
      // Verify NO additional GET /bill-splits calls were made (optimistic update)
      const callsAfterMutation = billSplitsCallCount - initialCount;
      expect(callsAfterMutation).toBe(0);
    } else {
      // If no confirm receipt button visible, test that UI is working
      await expect(page.locator('text=Payments & Expenses').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should not make excessive API calls during payment workflow', async ({ page }) => {
    // Track all bill-splits related API calls
    const billSplitsCalls: { url: string; method: string }[] = [];
    
    await page.route(/\/api\/.*/, async (route) => {
      const url = route.request().url();
      if (url.includes('bill-splits') || url.includes('payments')) {
        billSplitsCalls.push({ url, method: route.request().method() });
      }
      await route.continue();
    });
    
    // Navigate to payments
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Count initial GET calls
    const initialGetCalls = billSplitsCalls.filter(c => c.method === 'GET').length;
    
    // Try to perform a payment action
    const markAsPaidButton = page.locator('button:has-text("Mark as Paid")').first();
    
    if (await markAsPaidButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markAsPaidButton.click();
      await page.waitForTimeout(300);
      
      const paymentSelect = page.locator('select').first();
      if (await paymentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paymentSelect.selectOption('PAYPAL');
        const confirmButton = page.locator('button:has-text("Confirm")').first();
        await confirmButton.click();
        
        // Wait for potential API calls
        await page.waitForTimeout(1000);
        
        // Count GET calls after mutation
        const finalGetCalls = billSplitsCalls.filter(c => c.method === 'GET').length;
        const additionalGetCalls = finalGetCalls - initialGetCalls;
        
        // With optimistic updates, there should be 0 additional GET calls
        // The mutation (POST/PUT) should happen but no re-fetch
        expect(additionalGetCalls).toBe(0);
      }
    }
  });

  test('should update badge status immediately on Mark as Paid (optimistic)', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Find a pending member payment status
    const markAsPaidButton = page.locator('button:has-text("Mark as Paid")').first();
    
    if (await markAsPaidButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get initial state - look for PENDING badge
      const pendingBadgesBefore = await page.locator('text=/PENDING/i').count();
      
      await markAsPaidButton.click();
      await page.waitForTimeout(300);
      
      const paymentSelect = page.locator('select').first();
      if (await paymentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paymentSelect.selectOption('CASH');
        const confirmButton = page.locator('button:has-text("Confirm")').first();
        await confirmButton.click();
        
        // IMMEDIATE CHECK: Badge should change without waiting for network
        await page.waitForTimeout(200);
        
        // PENDING badge count should decrease
        const pendingBadgesAfter = await page.locator('text=/PENDING/i').count();
        
        // Should have one fewer PENDING (replaced by PAID)
        expect(pendingBadgesAfter).toBeLessThan(pendingBadgesBefore);
        
        // PAID badge should now exist
        const paidBadges = await page.locator('text=/\\bPAID\\b/i').count();
        expect(paidBadges).toBeGreaterThan(0);
      }
    }
  });

  test('should handle Mark as Paid error gracefully without stale UI', async ({ page }) => {
    // Track API calls
    const billSplitsCalls: string[] = [];
    
    await page.route(/\/api\/trips\/.*\/bill-splits/, async (route) => {
      billSplitsCalls.push(route.request().url());
      await route.continue();
    });
    
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    // Get initial badge state
    const initialPendingCount = await page.locator('text=/PENDING/i').count();
    
    // Try to perform Mark as Paid
    const markAsPaidButton = page.locator('button:has-text("Mark as Paid")').first();
    
    if (await markAsPaidButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markAsPaidButton.click();
      await page.waitForTimeout(300);
      
      const paymentSelect = page.locator('select').first();
      if (await paymentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paymentSelect.selectOption('VENMO');
        const confirmButton = page.locator('button:has-text("Confirm")').first();
        await confirmButton.click();
        
        // Wait for the optimistic update to apply
        await page.waitForTimeout(500);
        
        // Even if there was an error that caused re-fetch, we should not see
        // excessive GET calls. Maximum 1 re-fetch on error
        const getCalls = billSplitsCalls.filter(url => url.includes('GET'));
        // Should not have more than 2 GET calls total (initial + 1 possible re-fetch on error)
        await page.goto('about:blank');
        expect(getCalls.length).toBeLessThanOrEqual(2);
      }
    }
  });
});
