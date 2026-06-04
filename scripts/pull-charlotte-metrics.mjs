import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const publishResultsPath = path.join(repoRoot, "growth-dashboard-publish-results.json");
const metricsPath = path.join(repoRoot, "growth-dashboard-metrics-snapshot.json");

function userEnv(name) {
  if (process.platform !== "win32") {
    return "";
  }

  try {
    return execFileSync(
      "powershell.exe",
      ["-NoProfile", "-Command", `[Environment]::GetEnvironmentVariable('${name}', 'User')`],
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

async function pullXMetrics(postId) {
  const token = await refreshXAccessToken();
  const url = new URL(`https://api.x.com/2/tweets/${postId}`);
  url.searchParams.set("tweet.fields", "created_at,public_metrics,non_public_metrics,organic_metrics");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`X metrics pull failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const json = await response.json();
  return json?.data ?? null;
}

async function pullLinkedInMetrics(shareUrn) {
  const accessToken = envValue("LINKEDIN_ACCESS_TOKEN");

  if (!accessToken) {
    throw new Error("LinkedIn connector missing LINKEDIN_ACCESS_TOKEN.");
  }

  const encodedUrn = encodeURIComponent(shareUrn);
  const response = await fetch(`https://api.linkedin.com/v2/socialActions/${encodedUrn}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      unavailable: true,
      status: response.status,
      reason: text.slice(0, 300),
    };
  }

  return response.json();
}

async function main() {
  if (!existsSync(publishResultsPath)) {
    const empty = {
      app: "Growth Engineer Dashboard",
      preparedAt: new Date().toISOString(),
      metricsCallsMade: false,
      reason: "No live publish results found yet.",
      metrics: [],
    };
    await writeFile(metricsPath, `${JSON.stringify(empty, null, 2)}\n`);
    console.log("Growth Engineer Dashboard metrics snapshot prepared");
    console.log("metrics calls made: false");
    console.log("reason: no live publish results found");
    console.log(`output path: ${metricsPath}`);
    return;
  }

  const publishResults = JSON.parse(await readFile(publishResultsPath, "utf8"));
  const metrics = [];
  for (const result of publishResults.results ?? []) {
    if (result.channel === "X" && result.platformPostId) {
      const data = await pullXMetrics(result.platformPostId);
      metrics.push({
        id: result.id,
        channel: result.channel,
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
        pulledAt: new Date().toISOString(),
        publicMetrics: data?.public_metrics ?? null,
        nonPublicMetrics: data?.non_public_metrics ?? null,
        organicMetrics: data?.organic_metrics ?? null,
      });
    } else if (result.channel === "LinkedIn" && result.platformPostId) {
      const data = await pullLinkedInMetrics(result.platformPostId);
      metrics.push({
        id: result.id,
        channel: result.channel,
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
        pulledAt: new Date().toISOString(),
        socialActions: data,
      });
    }
  }

  const snapshot = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    metricsCallsMade: metrics.length > 0,
    metrics,
  };
  await writeFile(metricsPath, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log("Growth Engineer Dashboard metrics snapshot prepared");
  console.log(`metrics calls made: ${metrics.length > 0 ? "yes" : "false"}`);
  console.log(`posts measured: ${metrics.length}`);
  console.log(`output path: ${metricsPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
