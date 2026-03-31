const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Navigate to Edit Expense (Hawaii trip - trip-1)
  await page.goto('http://localhost:3000/trip/trip-1/payments/edit/bill-1');
  await page.waitForLoadState('networkidle');
  console.log('On Edit Expense page');

  // Check current values
  const descInput = page.locator('input[required]').first();
  console.log(`Description: ${await descInput.inputValue()}`);

  // Get initial button state
  const saveBtn = page.locator('button[type="submit"]');
  console.log(`Initial button text: "${await saveBtn.textContent()}"`);
  console.log(`Initial disabled: ${await saveBtn.isDisabled()}`);

  // Make a small change to description
  await descInput.fill('Updated Hotel');
  await page.waitForTimeout(100);

  // Click Save Changes
  await saveBtn.click();

  // Immediately check
  const textImmediately = await saveBtn.textContent();
  const disabledImmediately = await saveBtn.isDisabled();
  console.log(`Immediately after click - text: "${textImmediately}", disabled: ${disabledImmediately}`);

  // Wait for navigation
  await page.waitForTimeout(1000);
  const text1s = await saveBtn.textContent();
  const disabled1s = await saveBtn.isDisabled();
  console.log(`1s after click - text: "${text1s}", disabled: ${disabled1s}`);

  // Check URL
  console.log(`Current URL: ${page.url()}`);

  await browser.close();
  process.exit(0);
})();
