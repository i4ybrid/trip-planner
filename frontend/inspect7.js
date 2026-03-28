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
  
  // Try clicking Activities tab and looking for form elements
  await page.click('button:has-text("Activities")');
  await page.waitForTimeout(2000);
  
  // Now check for any form elements
  const allForms = await page.$$eval('form', fs => fs.map(f => ({
    id: f.id, className: f.className, 
    inputs: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder, id: i.id }))
  })));
  console.log('Forms:', JSON.stringify(allForms, null, 2));
  
  // Check for any button with text containing Add
  const addButtons = await page.$$eval('button', btns => btns.filter(b => b.textContent.toLowerCase().includes('add') || b.textContent.toLowerCase().includes('activity')).map(b => ({ text: b.textContent.trim(), disabled: b.disabled })));
  console.log('Add buttons:', JSON.stringify(addButtons, null, 2));
  
  // Check for any input elements
  const allInputs = await page.$$eval('input,textarea,select', els => els.map(e => ({ name: e.name, type: e.type, placeholder: e.placeholder, id: e.id })));
  console.log('All inputs:', JSON.stringify(allInputs, null, 2));
  
  // Click Payments tab
  await page.click('button:has-text("Payments")');
  await page.waitForTimeout(2000);
  
  const payAddButtons = await page.$$eval('button', btns => btns.filter(b => b.textContent.toLowerCase().includes('add') || b.textContent.toLowerCase().includes('expense') || b.textContent.toLowerCase().includes('payment')).map(b => ({ text: b.textContent.trim(), disabled: b.disabled })));
  console.log('Payments add buttons:', JSON.stringify(payAddButtons, null, 2));
  
  const payInputs = await page.$$eval('input,textarea,select', els => els.map(e => ({ name: e.name, type: e.type, placeholder: e.placeholder, id: e.id })));
  console.log('Payments inputs:', JSON.stringify(payInputs, null, 2));
  
  await browser.close();
})();
