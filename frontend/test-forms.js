const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function closeModal(page) {
  // Try cancel button or Escape
  await page.keyboard.press('Escape');
  await sleep(500);
  // Also try clicking cancel if visible
  try {
    const cancelBtn = await page.$('button:has-text("Cancel")');
    if (cancelBtn && await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await sleep(500);
    }
  } catch (e) {}
}

async function testLoginForm(browser) {
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    const submitBtn = await page.$('button[type="submit"]');
    
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"]');
        return btn && (btn.disabled || /loading|submitting|signing/i.test(btn.textContent));
      }, { timeout: 5000 }).catch(() => null),
      submitBtn.click()
    ]);
    await sleep(500);
    
    const isDisabled = await submitBtn.isDisabled();
    const text = await submitBtn.textContent();
    const hasLoading = /loading|submitting|signing/i.test(text);
    
    console.log(`LOGIN: disabled=${isDisabled}, loadingText=${hasLoading}, text="${text.trim()}"`);
    await page.close();
    return isDisabled || hasLoading ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`LOGIN: ERROR - ${e.message.substring(0, 100)}`);
    await page.close();
    return 'ERROR';
  }
}

async function testCreateTripForm(browser) {
  const page = await browser.newPage();
  try {
    // Login first
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    
    // Click "New Trip" in sidebar
    await page.click('button:has-text("New Trip")');
    await page.waitForTimeout(1000);
    
    // Check if a form appeared (could be a modal or inline form)
    const inputs = await page.$$eval('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea', 
      els => els.map(e => ({ type: e.type, placeholder: e.placeholder, name: e.name })));
    console.log('Create Trip inputs:', JSON.stringify(inputs));
    
    // Try to find and fill form fields
    const nameInput = await page.$('input[placeholder*="rip" i], input[placeholder*="name" i], input[name="name"]');
    const destInput = await page.$('input[placeholder*="est" i], input[placeholder*="destination" i], input[name="destination"]');
    if (nameInput) await nameInput.fill('QA Test Trip');
    if (destInput) await destInput.fill('Paris');
    
    const submitBtn = await page.$('button[type="submit"]:not(.toggle):visible, button:has-text("Create"):not(.toggle)');
    if (!submitBtn) {
      // Try to find the submit button in the form
      const formBtns = await page.$$eval('form button, .modal button[type="submit"]', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled })));
      console.log('Form buttons:', JSON.stringify(formBtns));
    }
    
    const btn = submitBtn || await page.$('button[type="submit"]:visible, button:has-text("Create"):visible');
    if (!btn) {
      console.log('CREATE TRIP: No submit button found');
      await page.close();
      return 'FAIL';
    }
    
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"]:not(.toggle), button:has-text("Create")');
        if (!btn) return false;
        return btn.disabled || /loading|submitting|creating/i.test(btn.textContent);
      }, { timeout: 5000 }).catch(() => null),
      btn.click()
    ]);
    await sleep(500);
    
    const isDisabled = await btn.isDisabled();
    const text = await btn.textContent();
    const hasLoading = /loading|submitting|creating/i.test(text);
    
    console.log(`CREATE TRIP: disabled=${isDisabled}, loadingText=${hasLoading}, text="${text.trim()}"`);
    await page.close();
    return isDisabled || hasLoading ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`CREATE TRIP: ERROR - ${e.message.substring(0, 100)}`);
    await page.close();
    return 'ERROR';
  }
}

async function testAddActivityForm(browser) {
  const page = await browser.newPage();
  try {
    // Login
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    
    // Navigate to trip
    await page.goto('http://localhost:3000/trip/trip-5', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    
    // Click Activities tab
    await page.click('button:has-text("Activities")');
    await page.waitForTimeout(500);
    
    // Click Add Activity
    await page.click('button:has-text("Add Activity")');
    await page.waitForTimeout(1000);
    
    // Fill the form
    const inputs = await page.$$('input:not([type="hidden"]), textarea');
    if (inputs.length > 0) await inputs[0].fill('Museum Visit');
    if (inputs.length > 2) await inputs[2].fill('NYC');
    
    // Find submit button within modal
    const modalSubmit = await page.$('.modal button[type="submit"], [role="dialog"] button[type="submit"], form button[type="submit"]');
    if (!modalSubmit) {
      console.log('ADD ACTIVITY: No submit button in modal');
      await closeModal(page);
      await page.close();
      return 'FAIL';
    }
    
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('[role="dialog"] button[type="submit"], .modal button[type="submit"], form button[type="submit"]');
        if (!btn) return false;
        return btn.disabled || /loading|submitting|adding/i.test(btn.textContent);
      }, { timeout: 5000 }).catch(() => null),
      modalSubmit.click()
    ]);
    await sleep(500);
    
    const isDisabled = await modalSubmit.isDisabled();
    const text = await modalSubmit.textContent();
    const hasLoading = /loading|submitting|adding/i.test(text);
    
    console.log(`ADD ACTIVITY: disabled=${isDisabled}, loadingText=${hasLoading}, text="${text.trim()}"`);
    await closeModal(page);
    await page.close();
    return isDisabled || hasLoading ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`ADD ACTIVITY: ERROR - ${e.message.substring(0, 100)}`);
    await closeModal(page);
    await page.close();
    return 'ERROR';
  }
}

async function testAddExpenseForm(browser) {
  const page = await browser.newPage();
  try {
    // Login
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    
    // Navigate to trip
    await page.goto('http://localhost:3000/trip/trip-5', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    
    // Click Payments tab
    await page.click('button:has-text("Payments")');
    await page.waitForTimeout(500);
    
    // Click Add Expense
    await page.click('button:has-text("Add Expense")');
    await page.waitForTimeout(1000);
    
    // Check for expense form
    const modalInputs = await page.$$('[role="dialog"] input, [role="dialog"] textarea, .modal input, .modal textarea');
    console.log('Expense modal inputs:', modalInputs.length);
    
    // Find submit button within modal
    const modalSubmit = await page.$('[role="dialog"] button[type="submit"], .modal button[type="submit"], form button[type="submit"]');
    if (!modalSubmit) {
      console.log('ADD EXPENSE: No submit button in modal');
      await closeModal(page);
      await page.close();
      return 'FAIL';
    }
    
    // Fill form if inputs available
    if (modalInputs.length > 0) await modalInputs[0].fill('Lunch');
    const numInputs = await page.$$('[role="dialog"] input[type="number"], .modal input[type="number"]');
    if (numInputs.length > 0) await numInputs[0].fill('25');
    
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('[role="dialog"] button[type="submit"], .modal button[type="submit"], form button[type="submit"]');
        if (!btn) return false;
        return btn.disabled || /loading|submitting|adding/i.test(btn.textContent);
      }, { timeout: 5000 }).catch(() => null),
      modalSubmit.click()
    ]);
    await sleep(500);
    
    const isDisabled = await modalSubmit.isDisabled();
    const text = await modalSubmit.textContent();
    const hasLoading = /loading|submitting|adding/i.test(text);
    
    console.log(`ADD EXPENSE: disabled=${isDisabled}, loadingText=${hasLoading}, text="${text.trim()}"`);
    await closeModal(page);
    await page.close();
    return isDisabled || hasLoading ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`ADD EXPENSE: ERROR - ${e.message.substring(0, 100)}`);
    await closeModal(page);
    await page.close();
    return 'ERROR';
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log('=== FORM LOADING STATE TESTS ===\n');
  
  const login = await testLoginForm(browser);
  const createTrip = await testCreateTripForm(browser);
  const addActivity = await testAddActivityForm(browser);
  const addExpense = await testAddExpenseForm(browser);
  
  await browser.close();
  
  console.log('\n=== FINAL RESULTS ===');
  console.log(`1. Login form:          ${login}`);
  console.log(`2. Create Trip form:    ${createTrip}`);
  console.log(`3. Add Activity form:   ${addActivity}`);
  console.log(`4. Add Expense form:    ${addExpense}`);
})();
