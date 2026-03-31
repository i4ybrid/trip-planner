const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`CONSOLE ERROR: ${msg.text()}`);
  });

  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Navigate to Add Expense on MY created trip
  await page.goto('http://localhost:3000/trip/cmne0a5qm000f11wlzupbwiiv/payments/add');
  await page.waitForLoadState('networkidle');
  console.log('On Add Expense page');

  // Fill description
  const descInput = page.locator('input[required]').first();
  await descInput.fill('API Error Test');

  // Fill amount
  const amountInput = page.locator('input[type="number"]').first();
  await amountInput.fill('100.00');
  console.log(`Amount value: ${await amountInput.inputValue()}`);

  const addBtn = page.locator('button[type="submit"]');

  // Click and check button state
  await addBtn.click();
  const btnTextImmediately = await addBtn.textContent();
  const btnDisabledImmediately = await addBtn.isDisabled();
  console.log(`Immediately after click - text: "${btnTextImmediately}", disabled: ${btnDisabledImmediately}`);

  // Wait for error state
  await page.waitForTimeout(1000);
  const btnText1s = await addBtn.textContent();
  const btnDisabled1s = await addBtn.isDisabled();
  console.log(`1s after click - text: "${btnText1s}", disabled: ${btnDisabled1s}`);

  // Check for error message
  const errorEls = await page.$$('[class*="error"], [role="alert"], .text-red');
  for (const el of errorEls) {
    const text = await el.textContent();
    if (text && text.trim()) console.log(`Error element: "${text.trim()}"`);
  }

  // Check URL
  console.log(`Current URL: ${page.url()}`);

  await browser.close();
  process.exit(0);
})();
