const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(4000);
  
  console.log('After login URL:', page.url());
  
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
