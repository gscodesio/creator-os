import test from "node:test";
import assert from "node:assert/strict";

import {
  parseDateString,
  formatDateString,
  getDaysDiff,
  addDays,
  getCurrentDateInTimezone,
  getEffectiveDate,
  getRelativeLaunchDates,
  getRollingWindow,
} from "../src/lib/domain/dateUtils.ts";

import {
  generateAndPrioritizeTasks,
  analyzeBufferDeficits,
} from "../src/lib/engine/taskEngine.ts";

import { setupTestAuth, teardownTestAuth } from "./testSessionHelper.mjs";

const BASE_URL = "http://localhost:3000";

test("Date & Simulation Audit Suite", async (t) => {
  await setupTestAuth(BASE_URL, "datesim");
  // =========================================================================
  // 1. Unconfigured Settings
  // =========================================================================
  await t.test("1. Unconfigured Settings: No tasks, no buffer deficits, no hardcoded date fallback", async () => {
    const unconfiguredSettings = {
      isConfigured: false,
      advanceBuffer: { days: 14 },
      publishingFrequency: {
        youtubeLong: { count: 2 },
        youtubeShorts: { count: 7 },
        instagramReels: { count: 7, derivedCount: 4, standaloneCount: 3 },
        linkedinPosts: { count: 4, informativeCount: 2, videoRelatedCount: 2 },
        carousel: { target: 2 },
      },
      launchPlan: {
        overallStartDate: "",
        currentSimulatedDate: "",
        useSimulatedDate: false,
      },
    };

    // Task generation must yield 0 tasks
    const generatedTasks = generateAndPrioritizeTasks({
      assets: [],
      topics: [],
      calendarEvents: [],
      settings: unconfiguredSettings,
      existingTasks: [],
    });
    assert.equal(generatedTasks.length, 0, "Unconfigured settings must not generate tasks");

    // Buffer deficit analysis must yield 0 targets and 0 deficits
    const deficits = analyzeBufferDeficits([], unconfiguredSettings);
    assert.equal(deficits.quotas.youtubeLong.target, 0);
    assert.equal(deficits.quotas.youtubeLong.deficit, 0);
    assert.equal(deficits.quotas.instagramReels.target, 0);
    assert.equal(deficits.quotas.instagramReels.deficit, 0);

    // Effective date must NOT fall back to hardcoded "2026-10-10"
    const effectiveDate = getEffectiveDate(unconfiguredSettings, "Asia/Kolkata");
    assert.notEqual(effectiveDate, "2026-10-10", "Unconfigured effective date must not be hardcoded 2026-10-10");
    const expectedCurrentDate = getCurrentDateInTimezone("Asia/Kolkata");
    assert.equal(effectiveDate, expectedCurrentDate, "Unconfigured effective date must be real current date in timezone");
  });

  // =========================================================================
  // 2. Real Current Date in Configured Timezone
  // =========================================================================
  await t.test("2. Real current date is calculated using configured timezone when simulation is disabled", () => {
    const settingsKolkata = {
      isConfigured: true,
      timezone: "Asia/Kolkata",
      useSimulatedDate: false,
      currentSimulatedDate: "2026-10-10",
    };
    const dateKolkata = getEffectiveDate(settingsKolkata);
    const expectedKolkata = getCurrentDateInTimezone("Asia/Kolkata");
    assert.equal(dateKolkata, expectedKolkata);
    assert.match(dateKolkata, /^\d{4}-\d{2}-\d{2}$/);

    const settingsUTC = {
      isConfigured: true,
      timezone: "UTC",
      useSimulatedDate: false,
      currentSimulatedDate: "2026-10-10",
    };
    const dateUTC = getEffectiveDate(settingsUTC);
    const expectedUTC = getCurrentDateInTimezone("UTC");
    assert.equal(dateUTC, expectedUTC);
  });

  // =========================================================================
  // 3. Simulation Mode: Enabled vs. Disabled
  // =========================================================================
  await t.test("3. Simulation date is used ONLY when simulation is explicitly enabled", () => {
    // When enabled with valid date -> uses simulated date
    const simEnabledSettings = {
      isConfigured: true,
      useSimulatedDate: true,
      currentSimulatedDate: "2026-12-25",
      timezone: "Asia/Kolkata",
    };
    assert.equal(getEffectiveDate(simEnabledSettings), "2026-12-25");

    // When disabled with simulated date present -> ignores simulated date, uses real current date
    const simDisabledSettings = {
      isConfigured: true,
      useSimulatedDate: false,
      currentSimulatedDate: "2026-12-25",
      timezone: "Asia/Kolkata",
    };
    const realDate = getCurrentDateInTimezone("Asia/Kolkata");
    assert.equal(getEffectiveDate(simDisabledSettings), realDate);

    // When enabled but simulated date is empty or invalid -> falls back safely to real current date
    const simInvalidSettings = {
      isConfigured: true,
      useSimulatedDate: true,
      currentSimulatedDate: "",
      timezone: "Asia/Kolkata",
    };
    assert.equal(getEffectiveDate(simInvalidSettings), realDate);
  });

  // =========================================================================
  // 4. User-Saved Launch Dates (No Hardcoded 2026-10-16 Fallback)
  // =========================================================================
  await t.test("4. User-saved launch date governs pre-launch calculation without default fallbacks", () => {
    const customLaunchDate = "2027-03-01";
    const settings = {
      isConfigured: true,
      useSimulatedDate: true,
      currentSimulatedDate: "2027-02-15",
      launchPlan: {
        overallStartDate: customLaunchDate,
        currentSimulatedDate: "2027-02-15",
        useSimulatedDate: true,
      },
      advanceBuffer: { days: 14 },
      publishingFrequency: {
        youtubeLong: { count: 2 },
        youtubeShorts: { count: 7 },
        instagramReels: { count: 7, derivedCount: 4, standaloneCount: 3 },
        linkedinPosts: { count: 4, informativeCount: 2, videoRelatedCount: 2 },
        carousel: { target: 2 },
      },
      taskPreferences: {
        autoTaskGen: true,
        autoBufferCalc: true,
      },
    };

    const effective = getEffectiveDate(settings);
    assert.equal(effective, "2027-02-15");

    const daysUntil = getDaysDiff(effective, customLaunchDate);
    assert.equal(daysUntil, 14, "Days until launch must be exactly 14 based on user-saved date");

    const relative = getRelativeLaunchDates(customLaunchDate);
    assert.equal(relative.launchDate, customLaunchDate);
    assert.equal(relative.preLaunchDate, addDays(customLaunchDate, -6));
    assert.equal(relative.postLaunchDate, addDays(customLaunchDate, 5));
  });

  // =========================================================================
  // 5. Live Next.js + Neon Settings API Persistence of Dates & Simulation
  // =========================================================================
  await t.test("5. API Persistence: Saving user launch date and simulation settings persists accurately", async () => {
    // 1. Save settings with simulation enabled and custom launch date
    const saveRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallStartDate: "2026-11-15",
        currentSimulatedDate: "2026-11-01",
        useSimulatedDate: true,
        advanceBuffer: { days: 14 },
      }),
    });
    assert.equal(saveRes.status, 200);
    const saved = await saveRes.json();
    assert.equal(saved.launchPlan.overallStartDate, "2026-11-15");
    assert.equal(saved.launchPlan.currentSimulatedDate, "2026-11-01");
    assert.equal(saved.launchPlan.useSimulatedDate, true);

    // 2. Fetch from GET /api/settings (survives refresh)
    const getRes = await fetch(`${BASE_URL}/api/settings`);
    assert.equal(getRes.status, 200);
    const fetched = await getRes.json();
    assert.equal(fetched.launchPlan.overallStartDate, "2026-11-15");
    assert.equal(fetched.launchPlan.currentSimulatedDate, "2026-11-01");
    assert.equal(fetched.launchPlan.useSimulatedDate, true);

    // 3. Update to disable simulation mode
    const disableSimRes = await fetch(`${BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        useSimulatedDate: false,
      }),
    });
    assert.equal(disableSimRes.status, 200);
    const disabledData = await disableSimRes.json();
    assert.equal(disabledData.launchPlan.useSimulatedDate, false);

    const getRes2 = await fetch(`${BASE_URL}/api/settings`);
    const fetched2 = await getRes2.json();
    assert.equal(fetched2.launchPlan.useSimulatedDate, false);
  });
});

test.after(async () => {
  await teardownTestAuth();
});
