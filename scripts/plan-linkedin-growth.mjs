import { writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = path.join(process.cwd(), "growth-dashboard-linkedin-playbook.json");

const playbook = {
  app: "Growth Engineer Dashboard",
  preparedAt: new Date().toISOString(),
  channel: "LinkedIn",
  objective: "Grow Ted's personal LinkedIn account using Charlotte Brief analysis as the content engine.",
  researchInputs: [
    {
      source: "last30days",
      finding:
        "Recent Reddit/HN results were noisy, but relevant Reddit creator threads emphasized consistency, comments, structure, and personal profile distribution.",
    },
    {
      source: "current web research",
      finding:
        "2026 LinkedIn creator guidance repeatedly points to personal profiles, strong hooks, dwell-time formats, meaningful comments, and repurposing proven posts.",
    },
  ],
  weeklySystem: {
    cadence: "3 LinkedIn posts per week from the personal profile",
    slots: ["Wednesday 4:00 PM", "Thursday 4:00 PM", "Tuesday 11:00 AM backup"],
    contentMix: [
      "2 opinionated Charlotte Brief analysis posts",
      "1 carousel or short video from the strongest episode argument",
      "daily comment block on 5-10 relevant Charlotte/business/civic posts",
    ],
  },
  postTemplate: {
    hook: "One sharp civic/business claim in the first 2-3 lines.",
    body: "Explain the tension, give the local facts, then add Ted's read.",
    close: "Ask a specific question that invites useful disagreement, not generic engagement bait.",
  },
  kanbanRequirements: [
    "Each LinkedIn card needs a hook, post draft, source URL, publish slot, and comment-target list.",
    "Approved LinkedIn cards should enter the connector queue for the 4 PM slot.",
    "Measured LinkedIn cards should track impressions, comments, profile visits if available, clicks, and follower change.",
  ],
  replicationRules: [
    "Do not sound like an agency growth post.",
    "Use Ted's local-analysis voice and make the post useful even if someone never clicks.",
    "Avoid generic hashtags and generic calls to action.",
    "Repurpose winners after 60-90 days with a new hook.",
  ],
};

await writeFile(outputPath, `${JSON.stringify(playbook, null, 2)}\n`);

console.log("Growth Engineer Dashboard LinkedIn playbook prepared");
console.log("cadence: 3 LinkedIn posts per week");
console.log("primary slots: Wednesday/Thursday 4:00 PM");
console.log("comment block: 5-10 relevant posts/day");
console.log(`output path: ${outputPath}`);
