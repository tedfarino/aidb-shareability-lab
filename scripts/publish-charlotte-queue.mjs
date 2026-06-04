import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const queuePath = path.join(repoRoot, "growth-dashboard-publish-queue.json");
const outputPath = path.join(repoRoot, "growth-dashboard-publish-dry-run.json");
const publishResultsPath = path.join(repoRoot, "growth-dashboard-publish-results.json");
const allowLivePublish = process.argv.includes("--allow-live-publish");
const executeLive = process.argv.includes("--execute-live");
const channelArgIndex = process.argv.indexOf("--channel");
const channelFilter = channelArgIndex >= 0 ? process.argv[channelArgIndex + 1] : "";

const connectorEnv = {
  LinkedIn: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_ACCESS_TOKEN", "LINKEDIN_AUTHOR_URN"],
  X: ["X_CLIENT_ID", "X_CLIENT_SECRET", "X_REFRESH_TOKEN"],
  YouTube: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"],
};

const publishableStatuses = new Set(["approved", "scheduled"]);

function userEnv(name) {
  if (process.platform !== "win32") {
    return "";
  }

  try {
    return execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `[Environment]::GetEnvironmentVariable('${name}', 'User')`,
      ],
      { encoding: "utf8", windowsHide: true },
    ).trim();
  } catch {
    return "";
  }
}

function envValue(name) {
  return process.env[name] || userEnv(name);
}

function setUserEnv(name, value) {
  if (!value || process.platform !== "win32") {
    return;
  }

  execFileSync("setx", [name, value], { encoding: "utf8", windowsHide: true });
}

function formEncode(body) {
  return new URLSearchParams(body).toString();
}

function connectorStatus(channel) {
  const required = connectorEnv[channel] ?? [];
  const envStatus = Object.fromEntries(
    required.map((name) => [name, envValue(name) ? "present" : "missing"]),
  );
  const ready = Object.values(envStatus).every((status) => status === "present");

  return {
    ready,
    envStatus,
  };
}

function plannedEndpoint(channel) {
  if (channel === "LinkedIn") {
    return "LinkedIn Posts API";
  }
  if (channel === "X") {
    return "X API post create";
  }
  if (channel === "YouTube") {
    return "YouTube Data API videos.insert";
  }
  return "unknown";
}

function realPublicUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value) && !value.includes("example.com");
}

async function refreshXAccessToken() {
  const clientId = envValue("X_CLIENT_ID");
  const clientSecret = envValue("X_CLIENT_SECRET");
  const refreshToken = envValue("X_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("X connector missing required OAuth values.");
  }

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`X token refresh failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const token = await response.json();
  if (token.refresh_token) {
    setUserEnv("X_REFRESH_TOKEN", token.refresh_token);
  }
  return token;
}

async function publishToX(item) {
  const token = await refreshXAccessToken();
  const text = item.body;
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X publish failed: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const json = await response.json();
  const id = json?.data?.id;
  return {
    platformPostId: id,
    platformPostUrl: id ? `https://x.com/i/web/status/${id}` : "",
  };
}

async function publishToLinkedIn(item) {
  const accessToken = envValue("LINKEDIN_ACCESS_TOKEN");
  const authorUrn = envValue("LINKEDIN_AUTHOR_URN");

  if (!accessToken || !authorUrn) {
    throw new Error("LinkedIn connector missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN.");
  }

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: item.body,
          },
          shareMediaCategory: "ARTICLE",
          media: [
            {
              status: "READY",
              originalUrl: item.preferredSocialUrl,
              title: {
                text: "Charlotte's Pattern Problem",
              },
              description: {
                text: "The Charlotte Brief on what changes after Charlotte hits pause.",
              },
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn publish failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  const postUrn = response.headers.get("x-restli-id") || "";
  return {
    platformPostId: postUrn,
    platformPostUrl: "",
  };
}

async function writePublishResults(newResults) {
  const existing = existsSync(publishResultsPath)
    ? JSON.parse(await readFile(publishResultsPath, "utf8"))
    : { app: "Growth Engineer Dashboard", results: [] };
  const merged = [...(existing.results ?? [])];

  for (const result of newResults) {
    const index = merged.findIndex(
      (existingResult) =>
        existingResult.id === result.id && existingResult.channel === result.channel,
    );
    if (index >= 0) {
      merged[index] = { ...merged[index], ...result };
    } else {
      merged.push(result);
    }
  }

  await writeFile(
    publishResultsPath,
    `${JSON.stringify(
      {
        app: "Growth Engineer Dashboard",
        preparedAt: new Date().toISOString(),
        results: merged,
      },
      null,
      2,
    )}\n`,
  );
}

async function main() {
  if (!existsSync(queuePath)) {
    throw new Error("Publish queue missing. Run npm run prepare:charlotte-publish first.");
  }

  const queueFile = JSON.parse(await readFile(queuePath, "utf8"));
  const publishResults = [];
  const queueItems = channelFilter
    ? queueFile.queue.filter((item) => item.channel.toLowerCase() === channelFilter.toLowerCase())
    : queueFile.queue;
  const results = [];

  for (const item of queueItems) {
    const connector = connectorStatus(item.channel);
    const statusAllowsPublish = publishableStatuses.has(item.status);
    const blockedBy = [];

    if (!statusAllowsPublish) {
      blockedBy.push(`status:${item.status}`);
    }
    if (!connector.ready) {
      blockedBy.push("connector:not_connected");
    }
    if (!allowLivePublish) {
      blockedBy.push("missing:--allow-live-publish");
    }
    if (item.requiresPreferredSocialUrl && !realPublicUrl(item.preferredSocialUrl)) {
      blockedBy.push(item.preferredSocialUrl ? "preferred_social_url:not_public" : "preferred_social_url:missing");
    }
    if (item.requiresEpisodeUrl && !realPublicUrl(item.episodeUrl)) {
      blockedBy.push(item.episodeUrl ? "legacy_episode_url:not_public" : "legacy_episode_url:missing");
    }

    const canPublishLive =
      allowLivePublish &&
      connector.ready &&
      statusAllowsPublish &&
      !(item.requiresPreferredSocialUrl && !realPublicUrl(item.preferredSocialUrl)) &&
      !(item.requiresEpisodeUrl && !realPublicUrl(item.episodeUrl));

    let action = canPublishLive ? "eligible_not_called" : "blocked";
    let platformPostUrl = "";

    if (canPublishLive && executeLive) {
      if (item.channel === "X") {
        const published = await publishToX(item);
        action = "published_live";
        platformPostUrl = published.platformPostUrl;
        publishResults.push({
          id: item.id,
          channel: item.channel,
          platformPostId: published.platformPostId,
          platformPostUrl,
          publishedAt: new Date().toISOString(),
        });
      } else if (item.channel === "LinkedIn") {
        const published = await publishToLinkedIn(item);
        action = "published_live";
        platformPostUrl = published.platformPostUrl;
        publishResults.push({
          id: item.id,
          channel: item.channel,
          platformPostId: published.platformPostId,
          platformPostUrl,
          publishedAt: new Date().toISOString(),
        });
      } else {
        action = "blocked";
        blockedBy.push("live_connector:not_implemented");
      }
    }

    results.push({
      id: item.id,
      channel: item.channel,
      status: item.status,
      scheduledForLocal: item.scheduledForLocal,
      endpoint: plannedEndpoint(item.channel),
      rssEpisodeUrl: item.rssEpisodeUrl || item.episodeUrl || "",
      preferredSocialUrl: item.preferredSocialUrl || "",
      preferredSocialDestination: item.preferredSocialDestination || "",
      dependencyStatus: item.dependencyStatus || "unknown",
      connectorEnv: connector.envStatus,
      livePublishEligible: canPublishLive,
      action,
      blockedBy,
      platformPostUrl,
      bodyPreview: item.body?.slice(0, 180) ?? item.description?.slice(0, 180) ?? "",
    });
  }

  const report = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    safety: {
      livePublishFlagPresent: allowLivePublish,
      liveExecutionFlagPresent: executeLive,
      livePublishCallsMade: publishResults.length > 0,
      notes:
        "X live publish is implemented behind --allow-live-publish and --execute-live. LinkedIn and YouTube remain eligibility checks.",
    },
    summary: {
      queueItems: results.length,
      eligibleIfConnectorsReady: results.filter((item) =>
        publishableStatuses.has(item.status),
      ).length,
      blocked: results.filter((item) => item.action === "blocked").length,
    },
    results,
  };

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  if (publishResults.length > 0) {
    await writePublishResults(publishResults);
  }

  console.log("Growth Engineer Dashboard guarded publish runner");
  console.log(`queue items: ${report.summary.queueItems}`);
  console.log(`eligible statuses: ${report.summary.eligibleIfConnectorsReady}`);
  console.log(`live publish flag present: ${allowLivePublish ? "yes" : "no"}`);
  console.log(`live execution flag present: ${executeLive ? "yes" : "no"}`);
  console.log(`live publish calls made: ${publishResults.length > 0 ? "yes" : "false"}`);
  for (const result of results) {
    console.log(`${result.channel} ${result.id}: ${result.action}`);
    if (result.blockedBy.length > 0) {
      console.log(`  blocked by: ${result.blockedBy.join(", ")}`);
    }
  }
  console.log(`output path: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
