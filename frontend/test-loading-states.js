const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function testLoginForm(browser) {
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    // Fill in login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    // Check button state before submit
    const btnBefore = await page.$('button[type="submit"]');
    const disabledBefore = await btnBefore.isDisabled();
    // Click submit and immediately check
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"]');
        return btn && (btn.disabled || btn.textContent.includes('Loading') || btn.textContent.includes('loading'));
      }, { timeout: 3000 }).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    await sleep(500);
    // Check loading state
    const btnAfter = await page.$('button[type="submit"]');
    const isDisabled = await btnAfter.isDisabled();
    const text = await btnAfter.textContent();
    const hasLoadingText = text.toLowerCase().includes('loading') || text.toLowerCase().includes('submitting');
    console.log(`LOGIN: disabled=${isDisabled}, loadingText=${hasLoadingText}, text="${text.trim()}"`);
    await page.close();
    return isDisabled || hasLoadingText ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`LOGIN: ERROR - ${e.message}`);
    await page.close();
    return 'ERROR';
  }
}

async function testCreateTripForm(browser, cookies) {
  const page = await browser.newPage();
  try {
    // First login to get session
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    await sleep(1000);
    
    // Find and fill create trip form
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(500);
    
    // Look for create trip button/form
    const createBtn = await page.$('button:has-text("Create Trip"), button:has-text("New Trip"), a:has-text("Create Trip"), a:has-text("New Trip")');
    if (createBtn) await createBtn.click();
    await sleep(500);
    
    // Fill form if visible
    const tripNameInput = await page.$('input[placeholder*="rip" i], input[name="name"], input[name="tripName"], input[id*="name"]');
    if (tripNameInput) await tripNameInput.fill('QA Test Trip');
    const destInput = await page.$('input[placeholder*="est" i], input[name="destination"], input[id*="destination"]');
    if (destInput) await destInput.fill('New York');
    
    const submitBtn = await page.$('button[type="submit"], button:has-text("Create"), button:has-text("Submit"), button:has-text("Save")');
    if (!submitBtn) {
      console.log('CREATE TRIP: No submit button found');
      await page.close();
      return 'FAIL';
    }
    
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"], button:has-text("Create"), button:has-text("Submit")');
        return btn && (btn.disabled || btn.textContent.toLowerCase().includes('loading') || btn.textContent.toLowerCase().includes('submitting'));
      }, { timeout: 3000 }).catch(() => null),
      submitBtn.click()
    ]);
    await sleep(500);
    
    const isDisabled = await submitBtn.isDisabled();
    const text = await submitBtn.textContent();
    const hasLoadingText = text.toLowerCase().includes('loading') || text.toLowerCase().includes('submitting');
    console.log(`CREATE TRIP: disabled=${isDisabled}, loadingText=${hasLoadingText}, text="${text.trim()}"`);
    await page.close();
    return isDisabled || hasLoadingText ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`CREATE TRIP: ERROR - ${e.message}`);
    await page.close();
    return 'ERROR';
  }
}

async function testAddActivityForm(browser) {
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    
    // Go to a trip page
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    const tripLink = await page.$('a[href*="/trip/"]');
    if (!tripLink) {
      console.log('ADD ACTIVITY: No trip link found');
      await page.close();
      return 'FAIL';
    }
    await tripLink.click();
    await page.waitForLoadState('networkidle');
    await sleep(1000);
    
    // Find add activity form
    const addActBtn = await page.$('button:has-text("Add Activity"), button:has-text("Activity"), a:has-text("Add Activity")');
    if (addActBtn) await addActBtn.click();
    await sleep(500);
    
    const actNameInput = await page.$('input[name*="activity" i], input[placeholder*="ctivity" i], input[id*="activity"]');
    if (actNameInput) await actNameInput.fill('Museum Visit');
    
    const submitBtn = await page.$('button[type="submit"], button:has-text("Add"), button:has-text("Submit"), button:has-text("Save")');
    if (!submitBtn) {
      console.log('ADD ACTIVITY: No submit button found');
      await page.close();
      return 'FAIL';
    }
    
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"], button');
        if (!btn) return false;
        return btn.disabled || btn.textContent.toLowerCase().includes('loading') || btn.textContent.toLowerCase().includes('submitting');
      }, { timeout: 3000 }).catch(() => null),
      submitBtn.click()
    ]);
    await sleep(500);
    
    const isDisabled = await submitBtn.isDisabled();
    const text = await submitBtn.textContent();
    const hasLoadingText = text.toLowerCase().includes('loading') || text.toLowerCase().includes('submitting');
    console.log(`ADD ACTIVITY: disabled=${isDisabled}, loadingText=${hasLoadingText}, text="${text.trim()}"`);
    await page.close();
    return isDisabled || hasLoadingText ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`ADD ACTIVITY: ERROR - ${e.message}`);
    await page.close();
    return 'ERROR';
  }
}

async function testAddExpenseForm(browser) {
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
    
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    const tripLink = await page.$('a[href*="/trip/"]');
    if (!tripLink) {
      console.log('ADD EXPENSE: No trip link found');
      await page.close();
      return 'FAIL';
    }
    await tripLink.click();
    await page.waitForLoadState('networkidle');
    await sleep(1000);
    
    // Find add expense form
    const addExpBtn = await page.$('button:has-text("Add Expense"), button:has-text("Expense"), a:has-text("Add Expense")');
    if (addExpBtn) await addExpBtn.click();
    await sleep(500);
    
    const expDescInput = await page.$('input[name*="description" i], input[name*="amount" i], input[placeholder*="escription" i], input[placeholder*="mount" i]');
    if (expDescInput) await expDescInput.fill('Lunch');
    const expAmountInput = await page.$('input[type="number"], input[name*="amount" i]');
    if (expAmountInput) await expAmountInput.fill('50');
    
    const submitBtn = await page.$('button[type="submit"], button:has-text("Add"), button:has-text("Submit"), button:has-text("Save")');
    if (!submitBtn) {
      console.log('ADD EXPENSE: No submit button found');
      await page.close();
      return 'FAIL';
    }
    
    await Promise.all([
      page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"], button');
        if (!btn) return false;
        return btn.disabled || btn.textContent.toLowerCase().includes('loading') || btn.textContent.toLowerCase().includes('submitting');
      }, { timeout: 3000 }).catch(() => null),
      submitBtn.click()
    ]);
    await sleep(500);
    
    const isDisabled = await submitBtn.isDisabled();
    const text = await submitBtn.textContent();
    const hasLoadingText = text.toLowerCase().includes('loading') || text.toLowerCase().includes('submitting');
    console.log(`ADD EXPENSE: disabled=${isDisabled}, loadingText=${hasLoadingText}, text="${text.trim()}"`);
    await page.close();
    return isDisabled || hasLoadingText ? 'PASS' : 'FAIL';
  } catch (e) {
    console.log(`ADD EXPENSE: ERROR - ${e.message}`);
    await page.close();
    return 'ERROR';
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log('--- FORM LOADING STATE TESTS ---');
  
  const login = await testLoginForm(browser);
  const createTrip = await testCreateTripForm(browser);
  const addActivity = await testAddActivityForm(browser);
  const addExpense = await testAddExpenseForm(browser);
  
  await browser.close();
  
  console.log('\n=== RESULTS ===');
  console.log(`Login form:         ${login}`);
  console.log(`Create Trip form:   ${createTrip}`);
  console.log(`Add Activity form:  ${addActivity}`);
  console.log(`Add Expense form:   ${addExpense}`);
})();
