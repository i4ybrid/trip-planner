const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  
  // Check page title/url
  console.log('URL:', page.url());
  
  // Check what's on the page
  const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()));
  console.log('Buttons:', JSON.stringify(buttons));
  
  const inputs = await page.$$eval('input', ins => ins.map(i => ({ type: i.type, placeholder: i.placeholder })));
  console.log('Inputs:', JSON.stringify(inputs));
  
  await browser.close();
})();
