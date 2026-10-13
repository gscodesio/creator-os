import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting puppeteer verification for Settings and Analytics...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  
  // 1. Settings - General
  console.log('Navigating to http://localhost:3000/settings...');
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_settings_general.png', fullPage: true });
  console.log('✓ Captured: screenshot_settings_general.png');

  // Helper to click left nav tabs
  const clickNavTab = async (tabName) => {
    await page.evaluate((name) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find(b => b.textContent && b.textContent.includes(name));
      if (target) {
        target.click();
      } else {
        throw new Error(`Nav tab button not found: ${name}`);
      }
    }, tabName);
    await new Promise(r => setTimeout(r, 600));
  };

  // 2. Settings - Publishing Frequency
  console.log('Switching to Publishing Frequency tab...');
  await clickNavTab('Publishing Frequency');
  // Test interactive counter: click '+' on YouTube Long
  await page.evaluate(() => {
    const plusButtons = Array.from(document.querySelectorAll('button'));
    const plus = plusButtons.find(b => b.innerHTML && b.innerHTML.includes('lucide-plus'));
    if (plus) plus.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_settings_frequency.png', fullPage: true });
  console.log('✓ Captured: screenshot_settings_frequency.png');

  // 3. Settings - Advance Buffer
  console.log('Switching to Advance Buffer tab...');
  await clickNavTab('Advance Buffer');
  // Test interactive selection: click '21 Days'
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn21 = buttons.find(b => b.textContent && b.textContent.includes('21'));
    if (btn21) btn21.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_settings_buffer.png', fullPage: true });
  console.log('✓ Captured: screenshot_settings_buffer.png');

  // 4. Settings - Scheduling Rules
  console.log('Switching to Scheduling Rules tab...');
  await clickNavTab('Scheduling Rules');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_settings_rules.png', fullPage: true });
  console.log('✓ Captured: screenshot_settings_rules.png');

  // 5. Settings - Connected Platforms
  console.log('Switching to Connected Platforms tab...');
  await clickNavTab('Connected Platforms');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_settings_platforms.png', fullPage: true });
  console.log('✓ Captured: screenshot_settings_platforms.png');

  // 6. Settings - Task Preferences
  console.log('Switching to Task Preferences tab...');
  await clickNavTab('Task Preferences');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_settings_task_preferences.png', fullPage: true });
  console.log('✓ Captured: screenshot_settings_task_preferences.png');

  // 7. Analytics Page (/analytics)
  console.log('Navigating directly to http://localhost:3000/analytics...');
  const analyticsResponse = await page.goto('http://localhost:3000/analytics', { waitUntil: 'networkidle0' });
  const status = analyticsResponse.status();
  console.log(`Analytics HTTP Status: ${status}`);
  if (status === 404) {
    throw new Error('Analytics page returned 404!');
  }
  
  // Hover over a bar on the chart to test interaction
  await page.hover('div[class*="group cursor-pointer"]');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_analytics.png', fullPage: true });
  console.log('✓ Captured: screenshot_analytics.png');

  await browser.close();
  console.log('All 6 Settings sections and Analytics captured and verified successfully!');
})();
