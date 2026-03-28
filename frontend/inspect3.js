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
  
  // Find trip card and click it (it's a div, not an anchor)
  const tripCards = await page.$$('.card-hover');
  console.log('Trip cards found:', tripCards.length);
  
  if (tripCards.length > 0) {
    // Get the href from the parent link or navigate via URL pattern
    const href = await page.$eval('.card-hover a, .card-hover [href*="/trip/"]', el => el.getAttribute('href')).catch(() => null);
    console.log('Found href:', href);
    
    // Try clicking the card itself
    const cardHtml = await tripCards[0].evaluate(el => el.outerHTML);
    console.log('Card HTML:', cardHtml.substring(0, 500));
    
    // Click the first card
    await tripCards[0].click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('Navigated to:', url);
    
    // Get all buttons and forms on trip page
    const tripButtons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled, classes: b.className.substring(0, 80) })));
    console.log('TRIP PAGE BUTTONS:', JSON.stringify(tripButtons, null, 2));
    
    // Get all links
    const tripLinks = await page.$$eval('a', ls => ls.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') })));
    console.log('TRIP PAGE LINKS:', JSON.stringify(tripLinks, null, 2));
    
    // Get all forms
    const forms = await page.$$eval('form', fs => fs.map(f => ({ id: f.id, className: f.className })));
    console.log('TRIP PAGE FORMS:', JSON.stringify(forms, null, 2));
  }
  
  await browser.close();
})();
