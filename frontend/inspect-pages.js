const { chromium } = require('playwright');

async function inspectPage(browser, url, name) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);
    const html = await page.content();
    // Get all buttons and links
    const buttons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled, type: b.type })));
    const links = await page.$$eval('a', ls => ls.map(l => ({ text: l.textContent.trim(), href: l.href })));
    console.log(`\n=== ${name} ===`);
    console.log('BUTTONS:', JSON.stringify(buttons, null, 2));
    console.log('LINKS (first 20):', JSON.stringify(links.slice(0, 20), null, 2));
    await page.close();
  } catch (e) {
    console.log(`${name}: ERROR - ${e.message}`);
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Login first
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const dashboardHtml = await page.content();
  const dashButtons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled, classes: b.className })));
  const dashLinks = await page.$$eval('a', ls => ls.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') })));
  console.log('DASHBOARD BUTTONS:', JSON.stringify(dashButtons, null, 2));
  console.log('DASHBOARD LINKS:', JSON.stringify(dashLinks, null, 2));
  
  // Go to first trip
  const tripLink = await page.$('a[href*="/trip/"]');
  if (tripLink) {
    await tripLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const tripButtons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), disabled: b.disabled })));
    const tripLinks = await page.$$eval('a', ls => ls.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') })));
    console.log('TRIP PAGE BUTTONS:', JSON.stringify(tripButtons, null, 2));
    console.log('TRIP PAGE LINKS:', JSON.stringify(tripLinks, null, 2));
  } else {
    console.log('No trip links found on dashboard');
  }
  
  await browser.close();
})();
