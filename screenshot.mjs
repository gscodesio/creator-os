import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  
  // Wait for network idle to ensure everything is rendered
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_landing.png', fullPage: true });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_dashboard.png', fullPage: true });

  const pages = ['topics', 'content', 'calendar', 'tasks', 'settings'];
  for (const p of pages) {
    await page.goto('http://localhost:3000/' + p, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'docs/design-references/images/screenshot_' + p + '.png', fullPage: true });
  }

  await browser.close();
})();
