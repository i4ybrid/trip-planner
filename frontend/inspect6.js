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
  
  // Get ALL text content
  const allText = await page.evaluate(() => document.body.innerText);
  console.log('Page text (first 3000):', allText.substring(0, 3000));
  
  // Click Activities tab
  await page.click('button:has-text("Activities")');
  await page.waitForTimeout(1000);
  
  const actText = await page.evaluate(() => document.body.innerText);
  console.log('\nActivities tab text (first 2000):', actText.substring(0, 2000));
  
  // Click Payments tab
  await page.click('button:has-text("Payments")');
  await page.waitForTimeout(1000);
  
  const payText = await page.evaluate(() => document.body.innerText);
  console.log('\nPayments tab text (first 2000):', payText.substring(0, 2000));
  
  await browser.close();
})();
