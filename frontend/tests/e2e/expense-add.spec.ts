import { test, expect } from '@playwright/test';
import { loginTestUser, navigateToTrip } from './helpers/auth';
import { TRIP_IDS } from './helpers/auth';

test.describe('Expense - Add', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, 'test');
  });

  test('should add an expense/payment to a trip', async ({ page }) => {
    const tripId = TRIP_IDS.hawaii;
    await navigateToTrip(page, tripId, 'payments', 'Payments & Expenses');

    // Click "Add Expense" or "Add Payment" button
    const addExpenseBtn = page.locator('button:has-text("Add Expense"), button:has-text("Add Payment"), button:has-text("New Expense")').first();
    await addExpenseBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addExpenseBtn.click();
    // Wait for form to open — the modal renders into a portal and takes time
    await page.waitForSelector('input[placeholder="Expense description"]', { state: 'visible', timeout: 10000 });

    // Fill expense form - description field uses placeholder
    const description = `Test Expense ${Date.now()}`;
    await page.locator('input[placeholder="Expense description"]').first().fill(description);
    // Amount is the number input
    await page.locator('input[type="number"]').first().fill('150.00');

    // Select payer from the Paid By dropdown (native <select>, no id attribute)
    const payerSelect = page.locator('select').first();
    if (await payerSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await payerSelect.selectOption({ index: 1 });
    }

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Expense should appear in the list
    await expect(page.locator(`text="${description}"`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show expense amount correctly', async ({ page }) => {
    const tripId = TRIP_IDS.hawaii;
    await navigateToTrip(page, tripId, 'payments', 'Payments & Expenses');

    const addExpenseBtn = page.locator('button:has-text("Add Expense"), button:has-text("Add Payment"), button:has-text("New Expense")').first();
    await addExpenseBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addExpenseBtn.click();
    await page.waitForSelector('input[placeholder="Expense description"]', { state: 'visible', timeout: 10000 });

    await page.locator('input[placeholder="Expense description"]').first().fill('Hotel Night');
    await page.locator('input[type="number"]').first().fill('200.00');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // The amount 200.00 should be displayed
    await expect(page.locator('text="200.00"').first()).toBeVisible({ timeout: 10000 });
  });
});
