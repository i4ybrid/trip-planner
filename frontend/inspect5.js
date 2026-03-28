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
  
  // Check for anchor inside card
  const anchorInCard = await page.$eval('.card-hover', el => {
    const anchors = el.querySelectorAll('a');
    return Array.from(anchors).map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() }));
  });
  console.log('Anchors inside card:', JSON.stringify(anchorInCard));
  
  // Try clicking and waiting for navigation
  await page.click('.card-hover');
  await page.waitForTimeout(3000);
  console.log('URL after click:', page.url());
  
  // Now check what's on the trip page
  const buttons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled })));
  console.log('Buttons on current page:', JSON.stringify(buttons, null, 2));
  
  const forms = await page.$$eval('form', fs => fs.map(f => ({ id: f.id, className: f.className, inputs: Array.from(f.querySelectorAll('input,select,textarea')).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder })) })));
  console.log('Forms on current page:', JSON.stringify(forms, null, 2));
  
  const links = await page.$$eval('a', ls => ls.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') })));
  console.log('Links on current page:', JSON.stringify(links.slice(0, 30), null, 2));
  
  await browser.close();
})();
