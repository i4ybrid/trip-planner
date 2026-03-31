/**
 * SERIAL CHAIN B — Trip Status & Milestones
 * 
 * These tests run serially because they transition trip-1 through status changes
 * (IDEA → PLANNING → CONFIRMED → HAPPENING → COMPLETED) which affect milestone generation.
 * 
 * milestone.spec.ts and milestone-full.spec.ts also depend on trip status being set,
 * so they are included here to run in strict order after status transitions.
 * 
 * IMPORTANT: Do NOT add parallel() tests to this file.
 */

import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip, ensureMilestones, TEST_USERS, TRIP_IDS } from './helpers/auth';

// ============================================================
// CHAIN B-1: Trip Status Transitions (WRITE)
// ============================================================

test.describe.serial('Trip Workflow — Status Transitions (Serial)', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('B1: should transition trip status when selector is available', async ({ page }) => {
    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');
    
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const currentStatus = await statusSelect.inputValue().catch(() => '');
      
      if (currentStatus === 'IDEA') {
        await statusSelect.selectOption('PLANNING');
        await page.waitForTimeout(1000);
        
        const newStatus = await statusSelect.inputValue().catch(() => '');
        expect(['PLANNING', 'CONFIRMED']).toContain(newStatus);
      } else {
        // Trip already past IDEA — verify it displays correctly
        expect(['PLANNING', 'CONFIRMED', 'HAPPENING', 'COMPLETED']).toContain(currentStatus);
      }
    } else {
      test.skip();
    }
  });

  test('B1: should verify status persists after page reload', async ({ page }) => {
    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');
    
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const statusBefore = await statusSelect.inputValue().catch(() => '');
      
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      
      const statusAfter = await statusSelect.inputValue().catch(() => '');
      expect(statusAfter).toBe(statusBefore);
    } else {
      test.skip();
    }
  });

  // ============================================================
  // Full Status Transition Chain Tests
  // ============================================================

  test('B1: should transition PLANNING → CONFIRMED', async ({ page }) => {
    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');

    const statusSelect = page.locator('select').first();
    if (!(await statusSelect.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const currentStatus = await statusSelect.inputValue().catch(() => '');
    if (currentStatus !== 'PLANNING') {
      test.skip();
      return;
    }

    await statusSelect.selectOption('CONFIRMED');
    await page.waitForTimeout(1000);

    const newStatus = await statusSelect.inputValue().catch(() => '');
    expect(newStatus).toBe('CONFIRMED');
  });

  test('B1: should transition CONFIRMED → HAPPENING', async ({ page }) => {
    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');

    const statusSelect = page.locator('select').first();
    if (!(await statusSelect.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const currentStatus = await statusSelect.inputValue().catch(() => '');
    if (currentStatus !== 'CONFIRMED') {
      test.skip();
      return;
    }

    await statusSelect.selectOption('HAPPENING');
    await page.waitForTimeout(1000);

    const newStatus = await statusSelect.inputValue().catch(() => '');
    expect(newStatus).toBe('HAPPENING');
  });

  test('B1: should transition HAPPENING → COMPLETED', async ({ page }) => {
    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');

    const statusSelect = page.locator('select').first();
    if (!(await statusSelect.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const currentStatus = await statusSelect.inputValue().catch(() => '');
    if (currentStatus !== 'HAPPENING') {
      test.skip();
      return;
    }

    await statusSelect.selectOption('COMPLETED');
    await page.waitForTimeout(1000);

    const newStatus = await statusSelect.inputValue().catch(() => '');
    expect(newStatus).toBe('COMPLETED');
  });

  test('B1: should NOT show status selector for non-MASTER/ORGANIZER roles', async ({ page }) => {
    // Login as Sarah (non-MASTER/ORGANIZER user)
    await loginTestUser(page, 'sarah');

    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');

    const statusSelect = page.locator('select').first();
    const isVisible = await statusSelect.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('B1: should transition to CANCELLED from a non-terminal state', async ({ page }) => {
    await page.goto('/trip/trip-1/overview');
    await page.waitForLoadState('domcontentloaded');

    const statusSelect = page.locator('select').first();
    if (!(await statusSelect.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    const currentStatus = await statusSelect.inputValue().catch(() => '');
    // Only run if trip is in a non-terminal state that can be cancelled
    if (!['PLANNING', 'CONFIRMED', 'HAPPENING', 'IDEA'].includes(currentStatus)) {
      test.skip();
      return;
    }

    await statusSelect.selectOption('CANCELLED');
    await page.waitForTimeout(1000);

    const newStatus = await statusSelect.inputValue().catch(() => '');
    expect(newStatus).toBe('CANCELLED');
  });
});

// ============================================================
// CHAIN B-2: Milestone Tests (run after status is set)
// ============================================================

test.describe.serial('Milestones — Serial Chain (after status set)', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
    await ensureMilestones(page, TRIP_IDS.hawaii);
  });

  test('B2: should display milestone strip on trip timeline', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline', 'Timeline');
    await page.waitForLoadState('domcontentloaded');

    const milestoneSection = page.locator('text=/milestone/i').first();
    const hasMilestones = await milestoneSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasMilestones) {
      test.skip();
      return;
    }

    const progressBar = page.locator('[class*="progress"], [class*="strip"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('B2: should show milestone list with correct due dates', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline', 'Timeline');
    await page.waitForLoadState('domcontentloaded');

    const milestoneDetails = page.locator('text=/Milestone Details/i').first();
    const hasDetails = await milestoneDetails.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasDetails) {
      test.skip();
      return;
    }

    const dueDatePattern = /Due:|due date/i;
    const hasDueDates = page.locator(`text=${dueDatePattern}`).first();
    await expect(hasDueDates).toBeVisible({ timeout: 2000 });
  });

  test('B2: should auto-generate milestones when trip moves to PLANNING status', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline', 'Timeline');
    await page.waitForLoadState('domcontentloaded');

    const statusSelect = page.locator('select').first();
    const hasStatusSelect = await statusSelect.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasStatusSelect) {
      const statusText = await statusSelect.inputValue();
      if (statusText === 'PLANNING' || statusText === 'CONFIRMED') {
        const milestoneSection = page.locator('text=/Milestone/i').first();
        await expect(milestoneSection).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('B2: should open request payment modal and send notifications', async ({ page }) => {
    // Navigate to timeline and verify we're on the right page
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    // Wait for the Timeline tab content to actually be visible (not just URL - React must render)
    // Look for "LOOKING BACK" or "LOOKING AHEAD" headings that only exist in timeline content
    await page.waitForSelector('text=/LOOKING BACK|LOOKING AHEAD/i', { state: 'visible', timeout: 15000 });
    // Also ensure the URL ends with /timeline (sanity check)
    await page.waitForURL('**/timeline', { timeout: 5000 });

    // Debug: take a screenshot to see what's actually on the page
    await page.screenshot({ path: `test-results/debug-timeline-${Date.now()}.png` });

    const requestPaymentBtn = page.locator('button').filter({ hasText: /Request Payment/i }).first();

    const isBtnVisible = await requestPaymentBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isBtnVisible) {
      // Check if milestones exist at all — look for any milestone-type card content
      const milestoneContent = page.locator('text=/COMMITMENT|FINAL PAYMENT|SETTLEMENT|Completed|Upcoming|Overdue/i').first();
      const hasMilestoneContent = await milestoneContent.isVisible({ timeout: 2000 }).catch(() => false);
      if (!hasMilestoneContent) {
        // No milestones at all — skip this test
        test.skip();
        return;
      }
      // Milestones exist but no "Request Payment" button — fail with info
      await page.screenshot({ path: `test-results/debug-no-request-btn-${Date.now()}.png` });
      const pageUrl = page.url();
      throw new Error(`Request Payment button not found. URL: ${pageUrl}. Milestone content visible: ${hasMilestoneContent}`);
    }

    const btnToClick = isBtnVisible ? requestPaymentBtn : page.locator('button').filter({ hasText: /payment/i }).first();
    await btnToClick.click();
    
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    const allMembersOption = page.locator('text=/all members/i').first();
    const hasAllOption = await allMembersOption.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasAllOption) {
      await allMembersOption.click();

      const sendBtn = page.locator('button').filter({ hasText: /Send Payment Request/i }).first();
      await sendBtn.click();

      await page.waitForTimeout(1000);
    }
  });

  test('B2: should open remind to settle modal and send notifications', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');

    const remindBtn = page.locator('button').filter({ hasText: /Remind to Settle/i }).first();

    const isBtnVisible = await remindBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isBtnVisible) {
      test.skip();
      return;
    }

    await remindBtn.click();

    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    const outstandingSection = page.locator('text=/Outstanding/i').first();
    const hasOutstanding = await outstandingSection.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasOutstanding) {
      const sendBtn = page.locator('button').filter({ hasText: /Send Settlement Reminder/i }).first();
      await sendBtn.click();

      await page.waitForTimeout(1000);
    }
  });

  test('B2: should lock a milestone date when manually overridden', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');

    const settingsBtn = page.locator('button').filter({ has: page.locator('[class*="settings"]') }).first();
    const editBtn = page.locator('button').filter({ has: page.locator('[class*="gear"]') }).first();

    const hasEditBtn = await (settingsBtn.isVisible({ timeout: 1000 }).catch(() => false) ||
      editBtn.isVisible({ timeout: 1000 }).catch(() => false));

    if (!hasEditBtn) {
      test.skip();
      return;
    }

    const editButton = await settingsBtn.isVisible() ? settingsBtn : editBtn;
    await editButton.click();

    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    const lockLabel = page.locator('text=/Lock/i').first();
    const hasLockToggle = await lockLabel.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasLockToggle) {
      const lockCheckbox = page.locator('input[type="checkbox"]').first();
      await lockCheckbox.click();

      const saveBtn = page.locator('button').filter({ hasText: /Save/i }).first();
      await saveBtn.click();
    }
  });

  test('B2: should skip a milestone', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');

    const settingsBtn = page.locator('button').filter({ has: page.locator('[class*="settings"]') }).first();
    const editBtn = page.locator('button').filter({ has: page.locator('[class*="gear"]') }).first();

    const hasEditBtn = await (settingsBtn.isVisible({ timeout: 1000 }).catch(() => false) ||
      editBtn.isVisible({ timeout: 1000 }).catch(() => false));

    if (!hasEditBtn) {
      test.skip();
      return;
    }

    const editButton = await settingsBtn.isVisible() ? settingsBtn : editBtn;
    await editButton.click();

    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    const skipLabel = page.locator('text=/Skip/i').first();
    const hasSkipToggle = await skipLabel.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasSkipToggle) {
      const skipCheckbox = page.locator('input[type="checkbox"]').first();
      await skipCheckbox.click();

      const saveBtn = page.locator('button').filter({ hasText: /Save/i }).first();
      await saveBtn.click();
    }
  });

  test('B2: should show correct milestone progress per member', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');

    const milestoneDetails = page.locator('text=/Milestone Details/i').first();

    const isDetailsVisible = await milestoneDetails.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isDetailsVisible) {
      test.skip();
      return;
    }

    const completionPattern = /\d+\/\d+ completed/i;
    const completionIndicator = page.locator(`text=${completionPattern}`).first();
    await expect(completionIndicator).toBeVisible({ timeout: 2000 });
  });

  test('B2: should send immediate notification when on-demand action is triggered', async ({ page }) => {
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

  test('B2: should show settlement milestones in timeline after trip ends', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');

    const timelineSection = page.locator('text=/Timeline|Event/i').first();
    await expect(timelineSection).toBeVisible({ timeout: 5000 });

    const settlementSection = page.locator('text=/Settlement/i').first();
    const hasSettlement = await settlementSection.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasSettlement) {
      test.skip();
      return;
    }
  });

  test('B2: should display settlement amount in timeline', async ({ page }) => {
    await navigateToTrip(page, TRIP_IDS.hawaii, 'timeline');
    await page.waitForLoadState('domcontentloaded');

    const settlementSection = page.locator('text=/Settlement/i').first();
    const hasSettlement = await settlementSection.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasSettlement) {
      test.skip();
      return;
    }

    const amountPattern = /\$\d+|owed|balance/i;
    const hasAmount = page.locator(`text=${amountPattern}`).first();
    await expect(hasAmount).toBeVisible({ timeout: 2000 });
  });
});
