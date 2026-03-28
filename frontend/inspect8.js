const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  // Navigate to trip
  await page.goto('http://localhost:3000/trip/trip-5', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  
  // Click Activities tab
  await page.click('button:has-text("Activities")');
  await page.waitForTimeout(1000);
  
  // Click Add Activity button
  await page.click('button:has-text("Add Activity")');
  await page.waitForTimeout(1500);
  
  // Now check for forms/inputs in modal
  const modalForms = await page.$$eval('form', fs => fs.map(f => ({
    id: f.id, className: f.className, 
    inputs: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder, id: i.id }))
  })));
  console.log('Modal forms:', JSON.stringify(modalForms, null, 2));
  
  const modalInputs = await page.$$eval('input,textarea,select', els => els.map(e => ({ name: e.name, type: e.type, placeholder: e.placeholder, id: e.id })));
  console.log('Modal inputs:', JSON.stringify(modalInputs, null, 2));
  
  const modalButtons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled, type: b.type })));
  console.log('Modal buttons:', JSON.stringify(modalButtons, null, 2));
  
  // Check for dialog/modal
  const dialogText = await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role="dialog"], .modal, .dialog, .sheet');
    return Array.from(dialogs).map(d => d.textContent.substring(0, 500));
  });
  console.log('Dialogs:', JSON.stringify(dialogText, null, 2));
  
  // Now try clicking Add Expense
  await page.click('button:has-text("Payments")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Add Expense")');
  await page.waitForTimeout(1500);
  
  const expForms = await page.$$eval('form', fs => fs.map(f => ({
    id: f.id, className: f.className,
    inputs: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder, id: i.id }))
  })));
  console.log('Expense modal forms:', JSON.stringify(expForms, null, 2));
  
  const expInputs = await page.$$eval('input,textarea,select', els => els.map(e => ({ name: e.name, type: e.type, placeholder: e.placeholder, id: e.id })));
  console.log('Expense modal inputs:', JSON.stringify(expInputs, null, 2));
  
  const expButtons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled, type: b.type })));
  console.log('Expense modal buttons:', JSON.stringify(expButtons, null, 2));
  
  await browser.close();
})();
