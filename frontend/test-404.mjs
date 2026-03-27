import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const failedRequests = [];
  
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} - ${response.url()}`);
    }
  });
  
  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login', { timeout: 30000 });
  
  console.log('Waiting 5 seconds...');
  await page.waitForTimeout(5000);
  
  console.log('Failed requests:', failedRequests);
  
  await browser.close();
}

test().catch(console.error);
