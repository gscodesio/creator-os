import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  
  // 1. Topics Master (All)
  await page.goto('http://localhost:3000/topics', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_topics_all.png', fullPage: true });

  // 2. Click YouTube Tab
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('YouTube') && text.includes('10')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_topics_youtube.png', fullPage: true });

  // 3. Click Reels Tab
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Reels') && text.includes('7')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_topics_reels.png', fullPage: true });

  // 4. Topic Detail - YouTube Long Video
  await page.goto('http://localhost:3000/topics/1', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_topic_detail_youtube.png', fullPage: true });

  // 5. Topic Detail - Standalone Reel
  await page.goto('http://localhost:3000/topics/3', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_topic_detail_reel.png', fullPage: true });

  await browser.close();
  console.log('Done capturing Topics screens!');
})();
