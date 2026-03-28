const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  // Look at New Trip button specifically
  const newTripBtn = await page.$('button:has-text("New Trip")');
  const btnInfo = await newTripBtn.evaluate(el => ({
    tagName: el.tagName,
    text: el.textContent,
    disabled: el.disabled,
    boundingBox: el.getBoundingClientRect(),
    styles: window.getComputedStyle(el),
    parent: el.parentElement.tagName,
    ancestors: Array.from(el.parentElement.children).map(c => c.tagName + ':' + c.className.substring(0, 50))
  }));
  console.log('New Trip button:', JSON.stringify(btnInfo, null, 2));
  
  // Check if the sidebar nav items have overflow hidden or something
  const sidebar = await page.$('.sidebar, nav, [class*="sidebar"]');
  if (sidebar) {
    const sidebarBox = await sidebar.evaluate(el => el.getBoundingClientRect());
    console.log('Sidebar bounding box:', JSON.stringify(sidebarBox));
  }
  
  // Check what buttons are visible with their positions
  const allBtns = await page.$$eval('button', btns => btns.map(b => {
    const box = b.getBoundingClientRect();
    return { text: b.textContent.trim().substring(0, 30), visible: box.width > 0 && box.height > 0, x: box.x, y: box.y, w: box.width, h: box.height };
  }).filter(b => b.visible));
  console.log('Visible buttons:', JSON.stringify(allBtns, null, 2));
  
  await browser.close();
})();
