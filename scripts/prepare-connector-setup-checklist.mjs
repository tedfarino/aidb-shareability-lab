import { writeFile } from "node:fs/promises";
import path from "node:path";

const outputPath = path.join(process.cwd(), "growth-dashboard-connector-setup-checklist.json");

const checklist = {
  app: "Growth Engineer Dashboard",
  preparedAt: new Date().toISOString(),
  safety: {
    secretsPrinted: false,
    platformCallsMade: false,
    notes: "This is a local setup checklist. It does not request tokens or call platform APIs.",
  },
  connectors: [
    {
      channel: "LinkedIn",
      purpose: "Publish approved Charlotte Brief analysis posts and pull engagement metadata.",
      appSetup: [
        "Create or use a LinkedIn developer app.",
        "Request/enable posting permissions for the intended member or organization.",
        "Set redirect URI for the dashboard OAuth helper once implemented.",
      ],
      envNeeded: [
        "LINKEDIN_CLIENT_ID",
        "LINKEDIN_CLIENT_SECRET",
        "LINKEDIN_ACCESS_TOKEN",
        "LINKEDIN_AUTHOR_URN",
      ],
      scopes: ["w_member_social", "r_member_social"],
      firstApiChecks: ["resolve author URN", "dry-run post payload validation", "read social metadata"],
    },
    {
      channel: "X",
      purpose: "Publish fast local-news hooks and pull post analytics.",
      appSetup: [
        "Create or use an X developer project/app.",
        "Enable OAuth 2.0 user-context auth.",
        "Grant read/write/offline scopes for the posting account.",
      ],
      envNeeded: ["X_CLIENT_ID", "X_CLIENT_SECRET", "X_REFRESH_TOKEN", "X_USER_ID"],
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      firstApiChecks: ["resolve authenticated user", "dry-run tweet payload length", "read post analytics"],
    },
    {
      channel: "YouTube",
      purpose: "Upload approved Shorts/video assets and pull watch metrics.",
      appSetup: [
        "Create or use a Google Cloud OAuth client.",
        "Enable YouTube Data API and YouTube Analytics API.",
        "Complete any required app verification before public uploads.",
      ],
      envNeeded: [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "YOUTUBE_REFRESH_TOKEN",
        "YOUTUBE_CHANNEL_ID",
      ],
      scopes: ["youtube.upload", "yt-analytics.readonly"],
      firstApiChecks: ["resolve channel identity", "verify upload permission", "read analytics report"],
    },
  ],
};

await writeFile(outputPath, `${JSON.stringify(checklist, null, 2)}\n`);

console.log("Growth Engineer Dashboard connector setup checklist prepared");
console.log("connectors: LinkedIn, X, YouTube");
console.log("platform calls made: false");
console.log("secrets printed: false");
console.log(`output path: ${outputPath}`);
