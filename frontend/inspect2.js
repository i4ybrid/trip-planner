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
  
  // Get main content
  const mainContent = await page.$eval('main', el => el.innerHTML).catch(() => 'no main');
  console.log('MAIN CONTENT (first 3000 chars):', mainContent.substring(0, 3000));
  
  // Also check full HTML structure
  const bodyHTML = await page.$eval('body', el => el.innerHTML).catch(() => '');
  console.log('\nBODY HTML (first 5000 chars):', bodyHTML.substring(0, 5000));
  
  await browser.close();
})();
