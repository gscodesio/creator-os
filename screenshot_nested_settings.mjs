import puppeteer from 'puppeteer';

(async () => {
  console.log('Testing and capturing State 1 and State 2 sidebar navigation...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });

  // ==========================================
  // STATE 1: MAIN NAVIGATION
  // ==========================================
  console.log('1. Navigating to http://localhost:3000/dashboard (State 1)...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify Main Menu section and items
  const state1NavText = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerText : '';
  });
  console.log('State 1 sidebar text summary:\n', state1NavText);
  if (!state1NavText.includes('MAIN MENU') || !state1NavText.includes('PLATFORMS') || !state1NavText.includes('Gopal Shukla')) {
    throw new Error('State 1 missing expected sections (MAIN MENU, PLATFORMS, Gopal Shukla)');
  }

  // Capture State 1 screenshot
  await page.screenshot({ path: 'docs/design-references/images/screenshot_sidebar_state1_main.png' });
  console.log('✓ Captured: screenshot_sidebar_state1_main.png');

  // ==========================================
  // TRANSITION: CLICK SETTINGS -> STATE 2
  // ==========================================
  console.log('2. Clicking "Settings" link in main sidebar...');
  const settingsLink = await page.$('aside nav a[href="/settings/general"]');
  if (!settingsLink) throw new Error('Settings link not found');
  await settingsLink.click();
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));

  console.log('Current URL after clicking Settings:', page.url());
  if (!page.url().includes('/settings')) {
    throw new Error('URL does not include /settings');
  }

  // Verify State 2 sidebar contents
  const state2NavText = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerText : '';
  });
  console.log('State 2 sidebar text summary:\n', state2NavText);
  if (!state2NavText.includes('Back to Main Menu') || !state2NavText.includes('SETTINGS') || !state2NavText.includes('General') || !state2NavText.includes('Gopal Shukla')) {
    throw new Error('State 2 missing expected items (Back to Main Menu, SETTINGS, General, Gopal Shukla)');
  }

  // Check that "General" is active with blue highlight and left accent
  const isGeneralActive = await page.evaluate(() => {
    const genLink = document.querySelector('aside nav a[href="/settings/general"]');
    return genLink && genLink.className.includes('bg-blue-50/80') && genLink.className.includes('border-blue-600');
  });
  console.log('Is General active with bg-blue-50/80 and border-blue-600:', isGeneralActive);
  if (!isGeneralActive) {
    throw new Error('General does not have expected active styling');
  }

  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
  });

  // Capture State 2 screenshot
  await page.screenshot({ path: 'docs/design-references/images/screenshot_sidebar_state2_settings.png' });
  console.log('✓ Captured: screenshot_sidebar_state2_settings.png');

  // ==========================================
  // CLICK SETTINGS ITEMS -> SWITCH PAGES
  // ==========================================
  const testSubmenuNav = async (href, label) => {
    console.log(`Clicking ${label} (${href})...`);
    const link = await page.$(`aside nav a[href="${href}"]`);
    if (!link) throw new Error(`Link not found for ${href}`);
    await link.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise(r => setTimeout(r, 600));

    console.log(`URL: ${page.url()}`);
    if (!page.url().includes(href)) {
      throw new Error(`Expected URL to contain ${href}`);
    }

    const isActive = await page.evaluate((targetHref) => {
      const el = document.querySelector(`aside nav a[href="${targetHref}"]`);
      return el && el.className.includes('bg-blue-50/80') && el.className.includes('border-blue-600');
    }, href);
    console.log(`Active state for ${label}:`, isActive);
    if (!isActive) throw new Error(`Active state not applied to ${label}`);
  };

  await testSubmenuNav('/settings/frequency', 'Publishing Frequency');
  await testSubmenuNav('/settings/buffer', 'Advance Buffer');
  await testSubmenuNav('/settings/rules', 'Scheduling Rules');
  await testSubmenuNav('/settings/platforms', 'Connected Platforms');
  await testSubmenuNav('/settings/tasks', 'Task Preferences');

  // ==========================================
  // CLICK "BACK TO MAIN MENU" -> RESTORES STATE 1
  // ==========================================
  console.log('3. Clicking "Back to Main Menu"...');
  const backBtn = await page.$('aside nav button');
  if (!backBtn) throw new Error('Back to Main Menu button not found');
  await backBtn.click();
  await new Promise(r => setTimeout(r, 600));

  const restoredText = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerText : '';
  });
  if (!restoredText.includes('MAIN MENU') || !restoredText.includes('Dashboard')) {
    throw new Error('Failed to restore main menu in sidebar');
  }
  console.log('✓ Successfully restored State 1 (Main Menu)');

  // ==========================================
  // NAVIGATE TO ANOTHER MAIN SECTION
  // ==========================================
  console.log('4. Navigating to Calendar from restored sidebar...');
  const calLink = await page.$('aside nav a[href="/calendar"]');
  if (!calLink) throw new Error('Calendar link not found');
  await calLink.click();
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 600));
  console.log('Current URL:', page.url());
  if (!page.url().includes('/calendar')) throw new Error('Did not navigate to /calendar');

  const calSidebarText = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerText : '';
  });
  if (!calSidebarText.includes('MAIN MENU')) {
    throw new Error('Main menu not visible on /calendar');
  }
  console.log('✓ Main menu retained on /calendar');

  // ==========================================
  // DIRECT OPEN & REFRESH OF SETTINGS SUBPAGE
  // ==========================================
  console.log('5. Directly loading and refreshing http://localhost:3000/settings/frequency...');
  await page.goto('http://localhost:3000/settings/frequency', { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const refreshedState2 = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    return aside ? aside.innerText : '';
  });
  if (!refreshedState2.includes('SETTINGS') || !refreshedState2.includes('Back to Main Menu')) {
    throw new Error('Settings sidebar state not restored on direct page refresh');
  }
  const isFreqActiveAfterRefresh = await page.evaluate(() => {
    const el = document.querySelector('aside nav a[href="/settings/frequency"]');
    return el && el.className.includes('bg-blue-50/80') && el.className.includes('border-blue-600');
  });
  console.log('Is Publishing Frequency active after refresh:', isFreqActiveAfterRefresh);
  if (!isFreqActiveAfterRefresh) {
    throw new Error('Publishing Frequency not active after refresh');
  }

  // ==========================================
  // CREATOR PROFILE ANCHORED AT BOTTOM
  // ==========================================
  const profileBottom = await page.evaluate(() => {
    const profile = document.querySelector('aside > div:last-child');
    return profile && profile.innerText.includes('Gopal Shukla') && profile.innerText.includes('Creator');
  });
  console.log('Creator profile anchored at bottom in State 2:', profileBottom);
  if (!profileBottom) {
    throw new Error('Creator profile not anchored at bottom');
  }

  await browser.close();
  console.log('======================================================');
  console.log('ALL SIDEBAR REDESIGN TESTS & VERIFICATIONS PASSED! ✓');
  console.log('======================================================');
})();
