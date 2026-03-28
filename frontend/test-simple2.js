const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  
  // Click demo user "Test User" button if available
  const testUserBtn = await page.$('button:has-text("Test User")');
  if (testUserBtn) {
    console.log('Using demo user login');
    await testUserBtn.click();
    await page.waitForTimeout(3000);
  } else {
    // Manual login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  
  console.log('After login URL:', page.url());
  
  // Get all buttons
  const buttons = await page.$$eval('button', btns => btns.map(b => {
    const box = b.getBoundingClientRect();
    return { 
      text: b.textContent.trim().substring(0, 40), 
      visible: box.width > 0 && box.height > 0,
      x: Math.round(box.x),
      y: Math.round(box.y),
      w: Math.round(box.width),
      h: Math.round(box.height)
    };
  }).filter(b => b.visible));
  console.log('Visible buttons:', JSON.stringify(buttons, null, 2));
  
  await browser.close();
})();
