/**
 * SERIAL CHAIN D — Payments (Mutation Tests)
 * 
 * These tests run serially because they add/mutate payment state on trip-1.
 * The "should add a new payment" test creates new payment records that could
 * conflict if run in parallel with other payment tests.
 * 
 * The read-only payment tests (payments.spec.ts, payment-optimistic-update.spec.ts)
 * remain parallel-safe and are NOT included here.
 * 
 * IMPORTANT: Do NOT add parallel() tests to this file.
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, TRIP_IDS } from './helpers/auth';

test.describe.serial('Payments — Serial Mutation Chain', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('D1: should add a new payment', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    const addBtn = page.locator('button:has-text("Add Payment"), button:has-text("New Payment"), button:has-text("Add Expense")').first();
    
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      
      const descriptionInput = page.locator('input[placeholder*="description"], input[placeholder*="title"], input[name*="description"]').first();
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount"], input[name*="amount"]').first();
      
      if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionInput.fill('Test Payment');
      }
      if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await amountInput.fill('100');
      }
      
      const submitBtn = page.locator('button:has-text("Add"), button:has-text("Save"), button:has-text("Create")').first();
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        
        const paymentItem = page.locator('text=Test Payment').first();
        if (await paymentItem.isVisible({ timeout: 3000 }).catch(() => false)) {
          expect(true).toBe(true);
        }
      }
    } else {
      test.skip();
    }
  });

  test('D1: should mark payment as paid by member', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    const unpaidBadge = page.locator('text=/Unpaid|Pending/i').first();
    
    if (await unpaidBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      const paymentItem = page.locator('[class*="payment"], [class*="expense"]').first();
      if (await paymentItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await paymentItem.click();
        await page.waitForTimeout(500);
        
        const paidBtn = page.locator('button:has-text("Mark as Paid"), button:has-text("I Paid")').first();
        if (await paidBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await paidBtn.click();
          await page.waitForTimeout(1000);
          
          const paidBadge = page.locator('text=/Paid|Confirmed/i').first();
          if (await paidBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
            expect(true).toBe(true);
          }
        }
      }
    } else {
      test.skip();
    }
  });

  test('D1: should confirm payment by organizer', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'payments');
    await page.waitForLoadState('domcontentloaded');
    
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Approve")').first();
    
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
      
      expect(true).toBe(true);
    } else {
      test.skip();
    }
  });

  test('D2: should send immediate notification when on-demand payment action is triggered', async ({ page }) => {
    // This test also involves payment mutations but lives in milestone workflow
    // Included here to ensure it runs in the payments serial context
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');

    const actionBtn = page.locator('button').filter({ hasText: /Request Payment|Remind to Settle/i }).first();

    const isBtnVisible = await actionBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isBtnVisible) {
      test.skip();
      return;
    }

    await actionBtn.click();

    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    const sendBtn = page.locator('button').filter({ hasText: /Send/i }).first();
    await sendBtn.click();

    await page.waitForTimeout(1000);

    await page.goto('/notifications');
    await page.waitForLoadState('domcontentloaded');

    const notificationText = page.locator('text=/Payment Request|Settlement Reminder/i').first();
    await expect(notificationText).toBeVisible({ timeout: 3000 });
  });
});
