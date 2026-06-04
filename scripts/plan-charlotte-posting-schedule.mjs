import { writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = path.join(process.cwd(), "growth-dashboard-posting-schedule.json");

const schedule = {
  app: "Growth Engineer Dashboard",
  preparedAt: new Date().toISOString(),
  timezone: "America/New_York",
  sourceResearch: [
    {
      source: "Sprout Social",
      finding:
        "Best LinkedIn windows in 2026 cluster around Tue-Thu 11 AM-5 PM local time, with weekends weakest.",
      url: "https://sproutsocial.com/insights/best-times-to-post-on-linkedin/",
    },
    {
      source: "Buffer",
      finding:
        "Buffer's 2026 analysis of 4.8M LinkedIn posts favors 3 PM-8 PM weekdays, especially Wednesday 4 PM.",
      url: "https://buffer.com/resources/best-time-to-post-on-linkedin/",
    },
  ],
  channelRules: {
    LinkedIn: {
      primarySlots: ["Wednesday 4:00 PM", "Thursday 4:00 PM"],
      backupSlots: ["Tuesday 11:00 AM", "Wednesday 11:00 AM", "Thursday 11:00 AM"],
      rule: "Use late afternoon for analysis posts; use 11 AM only for urgency tied to the local news cycle.",
    },
    X: {
      primarySlots: ["7:45 AM", "9:15 AM"],
      backupSlots: ["12:15 PM"],
      rule: "Use X for fast local-news framing and to tee up the deeper LinkedIn post.",
    },
    YouTube: {
      primarySlots: ["11:30 AM"],
      backupSlots: ["4:30 PM"],
      rule: "Use YouTube after the morning listen/review pass once the short concept is approved.",
    },
  },
  dailyWorkflow: [
    "5:00 AM Charlotte Brief generation completes",
    "5:30 AM listen once and review generated cards",
    "approve X morning hook first if it is time-sensitive",
    "approve YouTube short concept after audio review",
    "approve LinkedIn analysis for the 4 PM test slot",
    "pull metrics at 1h, 6h, 24h, and 72h",
  ],
};

await writeFile(outputPath, `${JSON.stringify(schedule, null, 2)}\n`);

console.log("Growth Engineer Dashboard posting schedule prepared");
console.log("LinkedIn primary: Wednesday/Thursday 4:00 PM");
console.log("LinkedIn backup: Tuesday-Thursday 11:00 AM");
console.log(`output path: ${outputPath}`);
