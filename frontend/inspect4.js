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
  
  // Look for parent anchor or Link wrapping the card
  const parentLink = await page.$('.card-hover').then(el => el?.evaluate(e => {
    const parent = e.parentElement;
    let curr = e;
    while (curr) {
      if (curr.tagName === 'A') return 'A: ' + curr.getAttribute('href');
      if (curr.tagName === 'BUTTON') return 'BUTTON';
      curr = curr.parentElement;
    }
    return 'no parent link';
  }));
  console.log('Parent link:', parentLink);
  
  // Check if there's an onClick handler
  const onClick = await page.$eval('.card-hover', el => el.getAttribute('onclick') || el.onclick?.toString().substring(0, 200)).catch(() => 'n/a');
  console.log('onClick:', onClick);
  
  // Check if cards have data-trip-id or similar
  const cardData = await page.$$eval('.card-hover', cards => cards.map(c => ({
    html: c.outerHTML.substring(0, 300)
  })));
  console.log('Card data:', JSON.stringify(cardData[0], null, 2));
  
  // Check for any data attributes
  const dataAttrs = await page.$$eval('.card-hover', cards => cards.map(c => ({
    'data-trip': c.getAttribute('data-trip-id'),
    'data-id': c.getAttribute('data-id'),
    onclick: c.getAttribute('onclick'),
  })));
  console.log('Data attrs:', JSON.stringify(dataAttrs, null, 2));
  
  await browser.close();
})();
