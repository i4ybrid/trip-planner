import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
  
  console.log('Waiting for content...');
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for the email field
  const emailField = await page.$('#email');
  console.log('Email field found:', !!emailField);
  
  // Check what text is visible
  const bodyText = await page.locator('body').textContent();
  console.log('Body text:', bodyText?.substring(0, 200));
  
  // Check for errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  await browser.close();
}

test().catch(console.error);
