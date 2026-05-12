
import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Get token via API
    const response = await page.request.post('http://localhost:4000/api/auth/login', {
      data: { email: 'test@example.com', password: 'password123' }
    });
    const json = await response.json();
    const token = json.data?.token;
    
    if (!token) {
      console.log('NO TOKEN, response:', JSON.stringify(json));
      return;
    }
    
    console.log('Got token:', token.substring(0, 50) + '...');
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Set the token in localStorage to simulate auth provider reading it
    await page.evaluate((t) => {
      // Set auth-storage (what next-auth typically uses)
      localStorage.setItem('auth-storage', JSON.stringify({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
        accessToken: t,
        expires: new Date(Date.now() + 86400000).toISOString()
      }));
      // Also set any other auth-related keys
      localStorage.setItem('tp_session', t);
    }, token);
    
    console.log('Set localStorage auth');
    
    // Navigate to notifications
    await page.goto('http://localhost:3000/notifications', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    
    console.log('URL:', url);
    console.log('BODY:', bodyText.substring(0, 1500));
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/notifications_check.png', fullPage: true });
    console.log('SCREENSHOT: /tmp/notifications_check.png');
    
  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
