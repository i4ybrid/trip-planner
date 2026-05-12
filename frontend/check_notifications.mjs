
import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login
    await page.goto('http://localhost:3000/login', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Click Test User quick login button
    await page.click('button:has-text("Test User")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Wait for and click submit
    await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForURL('**/dashboard', { timeout: 30000 })
    ]);
    
    console.log('LOGIN SUCCESS - URL:', page.url());
    
    // Navigate to notifications
    await page.goto('http://localhost:3000/notifications', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    
    console.log('URL:', url);
    console.log('BODY:', bodyText);
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/notifications_check.png', fullPage: true });
    console.log('SCREENSHOT: /tmp/notifications_check.png');
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
