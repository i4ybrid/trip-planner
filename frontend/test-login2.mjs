import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(`[PAGE ERROR] ${error.message}`);
  });
  
  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login', { timeout: 30000 });
  
  console.log('Waiting 8 seconds...');
  await page.waitForTimeout(8000);
  
  console.log('Console logs:', consoleLogs);
  console.log('Page errors:', errors);
  
  // Check for the email field
  const emailField = await page.$('#email');
  console.log('Email field found:', !!emailField);
  
  const bodyText = await page.locator('body').textContent();
  console.log('Body text:', bodyText?.substring(0, 300));
  
  await browser.close();
}

test().catch(console.error);
