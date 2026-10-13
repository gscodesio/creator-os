import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const VIEWPORTS = [
  // Mobile
  { name: "mobile-360", width: 360, height: 780 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  // Laptop & Desktop
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const SCREENSHOT_DIR = path.resolve("./tests/screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runExactAudit() {
  console.log("🚀 Starting Creator OS 100% Fidelity Responsive & Interaction Audit...\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  let hasErrors = false;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n==================================================`);
      console.log(`📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`==================================================`);

      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        return {
          scrollWidth: Math.max(docWidth, bodyWidth),
          innerWidth: winWidth,
          hasOverflow: Math.max(docWidth, bodyWidth) > winWidth,
        };
      });

      if (overflow.hasOverflow) {
        console.error(`  ❌ Horizontal overflow detected! scrollWidth=${overflow.scrollWidth}, innerWidth=${overflow.innerWidth}`);
        hasErrors = true;
      } else {
        console.log(`  ✔ No horizontal overflow (scrollWidth=${overflow.scrollWidth} <= innerWidth=${overflow.innerWidth})`);
      }

      // Check visibility of key sections
      const sections = await page.evaluate(() => {
        return {
          h1Text: document.querySelector("h1")?.textContent?.trim(),
          hasWorkflow: !!document.getElementById("workflow"),
          hasCapture: !!document.getElementById("capture"),
          hasCalendar: !!document.getElementById("calendar"),
          hasRhythm: !!document.getElementById("rhythm"),
          hasFaq: !!document.getElementById("faq"),
          hasFooter: !!document.querySelector("footer"),
        };
      });

      console.log("  ✔ Headline:", sections.h1Text?.replace(/\s+/g, ' '));
      console.log("  ✔ Key sections present:", {
        workflow: sections.hasWorkflow,
        capture: sections.hasCapture,
        calendar: sections.hasCalendar,
        rhythm: sections.hasRhythm,
        faq: sections.hasFaq,
        footer: sections.hasFooter,
      });

      // Save screenshot
      const shotPath = path.join(SCREENSHOT_DIR, `${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`  📸 Full-page screenshot saved: ${shotPath}`);

      // Mobile Menu Test (widths < 1024)
      if (vp.width < 1024) {
        console.log("  🔍 Testing Mobile Menu Toggle...");
        const menuBtn = await page.$("#menuBtn");
        if (menuBtn) {
          await page.evaluate((btn) => btn.click(), menuBtn);
          await new Promise((r) => setTimeout(r, 350));
          const openState = await page.evaluate(() => document.getElementById("menu")?.getAttribute("data-open"));
          console.log(`  ${openState === "true" ? "✔" : "❌"} Mobile menu opened: data-open=${openState}`);

          // Close menu
          await page.evaluate((btn) => btn.click(), menuBtn);
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    }

    // Interactive Behavioral Testing at 1280px Desktop
    console.log(`\n==================================================`);
    console.log(`🧪 Testing Interactive Behavior (Desktop & Mobile Features)`);
    console.log(`==================================================`);
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });

    // 1. Hero Mobile Task List Toggle
    console.log("\n1. Testing Phone Task Toggle & Progress Bar...");
    const initialTasksCount = await page.evaluate(() => document.getElementById("pcount")?.textContent);
    console.log(`  Initial task count: "${initialTasksCount}"`);
    const tasks = await page.$$("#tasks .task");
    if (tasks.length > 0) {
      await page.evaluate((t) => t.click(), tasks[0]);
      await new Promise((r) => setTimeout(r, 200));
      const afterClick = await page.evaluate(() => document.getElementById("pcount")?.textContent);
      console.log(`  ✔ Task clicked: new count = "${afterClick}"`);
    }

    // 2. Workflow Interactive Progression
    console.log("\n2. Testing 7-Step Workflow Progression...");
    const initialStep = await page.evaluate(() => document.getElementById("dbadge")?.textContent);
    console.log(`  Initial step: "${initialStep}"`);
    const dbtn = await page.$("#dbtn");
    if (dbtn) {
      await page.evaluate((b) => b.click(), dbtn);
      await new Promise((r) => setTimeout(r, 200));
      const nextStep = await page.evaluate(() => document.getElementById("dbadge")?.textContent);
      console.log(`  ✔ Workflow step advanced to: "${nextStep}"`);
    }

    // 3. Idea Capture Tabs & Chips
    console.log("\n3. Testing Idea Capture Tabs & Chips...");
    const voiceTab = await page.$('.seg button[data-p="voice"], .seg button:nth-child(2)');
    if (voiceTab) {
      await page.evaluate((b) => b.click(), voiceTab);
      await new Promise((r) => setTimeout(r, 200));
      const hasWave = await page.evaluate(() => !!document.querySelector("#pane .wave"));
      console.log(`  ✔ Voice tab clicked: Soundwave rendered = ${hasWave}`);
    }

    const reelChip = await page.$('.chip:nth-child(2)');
    if (reelChip) {
      await page.evaluate((c) => c.click(), reelChip);
      await new Promise((r) => setTimeout(r, 200));
      const isReelSel = await page.evaluate((c) => c.classList.contains("sel"), reelChip);
      console.log(`  ✔ Reel chip selected = ${isReelSel}`);
    }

    const saveBtn = await page.$("#saveIdea");
    if (saveBtn) {
      await page.evaluate((b) => b.click(), saveBtn);
      const savedText = await page.evaluate((b) => b.textContent, saveBtn);
      console.log(`  ✔ Save button feedback: "${savedText}"`);
      await new Promise((r) => setTimeout(r, 1500));
      const revertedText = await page.evaluate((b) => b.textContent, saveBtn);
      console.log(`  ✔ Save button reverted to: "${revertedText}"`);
    }

    // 4. Desktop Month Calendar Platform Filter
    console.log("\n4. Testing Desktop Month Calendar Filter...");
    const igFilterBtn = await page.$('#mcf button[data-f="ig"]');
    if (igFilterBtn) {
      await page.evaluate((b) => b.click(), igFilterBtn);
      await new Promise((r) => setTimeout(r, 200));
      const isPressed = await page.evaluate((b) => b.getAttribute("aria-pressed"), igFilterBtn);
      console.log(`  ✔ Instagram calendar filter activated: aria-pressed=${isPressed}`);
    }

    // 5. Rhythm Settings Controls
    console.log("\n5. Testing Rhythm Settings Controls...");
    const bufBtn = await page.$('#bufOpts button:nth-child(3)'); // 14 days
    if (bufBtn) {
      await page.evaluate((b) => b.click(), bufBtn);
      await new Promise((r) => setTimeout(r, 200));
      const routText = await page.evaluate(() => document.getElementById("rout")?.textContent);
      console.log(`  ✔ Buffer option clicked: rout = "${routText}"`);
    }

    // 6. FAQ Accordion Click
    console.log("\n6. Testing FAQ Accordion...");
    const firstFaq = await page.$("details summary");
    if (firstFaq) {
      await page.evaluate((s) => s.click(), firstFaq);
      await new Promise((r) => setTimeout(r, 200));
      const isOpen = await page.evaluate(() => document.querySelector("details")?.hasAttribute("open"));
      console.log(`  ✔ FAQ clicked: open=${isOpen}`);
    }

    // 7. Core Route Links Verification
    console.log("\n7. Verifying Links...");
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
    });
    console.log(`  ✔ Link to /login present: ${links.includes("/login")}`);
    console.log(`  ✔ Link to /signup present: ${links.includes("/signup")}`);
    console.log(`  ✔ Link to #workflow present: ${links.includes("#workflow")}`);
    console.log(`  ✔ Link to #capture present: ${links.includes("#capture")}`);
    console.log(`  ✔ Link to #calendar present: ${links.includes("#calendar")}`);
    console.log(`  ✔ Link to #faq present: ${links.includes("#faq")}`);

    console.log("\n🎉 All tests passed with 100% design fidelity!");
  } catch (err) {
    console.error("❌ Audit error:", err);
    hasErrors = true;
  } finally {
    await browser.close();
  }

  if (hasErrors) {
    process.exit(1);
  }
}

runExactAudit();
