import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  
  // 1. Content Master (All)
  await page.goto('http://localhost:3000/content', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_content_all.png', fullPage: true });

  // 2. YouTube Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const yt = btns.find(b => b.textContent && b.textContent.includes('YouTube'));
    if (yt) yt.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_content_youtube.png', fullPage: true });

  // 3. Reels Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const reels = btns.find(b => b.textContent && b.textContent.includes('Reels'));
    if (reels) reels.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_content_reels.png', fullPage: true });

  // 4. LinkedIn Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const li = btns.find(b => b.textContent && b.textContent.includes('LinkedIn'));
    if (li) li.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_content_linkedin.png', fullPage: true });

  // 5. Carousel Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const car = btns.find(b => b.textContent && b.textContent.includes('Carousel'));
    if (car) car.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'docs/design-references/images/screenshot_content_carousel.png', fullPage: true });

  // 6. Content Detail - YouTube Long Video (/content/1)
  await page.goto('http://localhost:3000/content/1', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_content_detail_youtube.png', fullPage: true });

  // 7. Content Detail - Standalone Reel (/content/5)
  await page.goto('http://localhost:3000/content/5', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'docs/design-references/images/screenshot_content_detail_reel.png', fullPage: true });

  await browser.close();
  console.log('All Content screens captured successfully!');
})();
