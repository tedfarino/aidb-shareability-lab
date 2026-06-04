import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();
const uploadPlanPath = path.join(repoRoot, "growth-dashboard-youtube-upload-plan.json");
const uploadResultPath = path.join(repoRoot, "growth-dashboard-youtube-upload-result.json");
const allowLivePublish = process.argv.includes("--allow-live-publish");
const executeLive = process.argv.includes("--execute-live");

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

function formEncode(body) {
  return new URLSearchParams(body).toString();
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<\/p>\s*<p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

async function refreshAccessToken() {
  const clientId = envValue("GOOGLE_CLIENT_ID");
  const clientSecret = envValue("GOOGLE_CLIENT_SECRET");
  const refreshToken = envValue("YOUTUBE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("YouTube connector missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or YOUTUBE_REFRESH_TOKEN.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formEncode({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube token refresh failed: ${response.status} ${text.slice(0, 300)}`);
  }

  return response.json();
}

async function main() {
  if (!existsSync(uploadPlanPath)) {
    throw new Error("YouTube upload plan missing. Run npm run prepare:youtube-upload first.");
  }

  const plan = JSON.parse(await readFile(uploadPlanPath, "utf8"));
  const videoPath = plan.videoAsset?.localPath;
  if (!videoPath || !existsSync(videoPath)) {
    throw new Error("YouTube upload video asset missing. Run npm run render:charlotte-audiogram first.");
  }

  if (!allowLivePublish || !executeLive) {
    const dryRun = {
      app: "Growth Engineer Dashboard",
      preparedAt: new Date().toISOString(),
      uploadCallsMade: false,
      blockedBy: [
        ...(!allowLivePublish ? ["missing:--allow-live-publish"] : []),
        ...(!executeLive ? ["missing:--execute-live"] : []),
      ],
      videoPath,
      uploadDraft: plan.uploadDraft,
    };
    await writeFile(uploadResultPath, `${JSON.stringify(dryRun, null, 2)}\n`);
    console.log("Growth Engineer Dashboard YouTube upload runner");
    console.log("upload calls made: false");
    console.log(`blocked by: ${dryRun.blockedBy.join(", ")}`);
    console.log(`output path: ${uploadResultPath}`);
    return;
  }

  const token = await refreshAccessToken();
  const videoBytes = await readFile(videoPath);
  const metadata = {
    snippet: {
      title: stripHtml(plan.uploadDraft?.title || "Charlotte's Pattern Problem"),
      description: stripHtml(plan.uploadDraft?.description || ""),
      tags: plan.uploadDraft?.tags || ["Charlotte", "Charlotte NC", "local news"],
      categoryId: plan.uploadDraft?.categoryId || "25",
    },
    status: {
      privacyStatus: plan.uploadDraft?.privacyStatus || "unlisted",
      selfDeclaredMadeForKids: false,
    },
  };

  const initUrl = new URL("https://www.googleapis.com/upload/youtube/v3/videos");
  initUrl.searchParams.set("uploadType", "resumable");
  initUrl.searchParams.set("part", "snippet,status");

  const initResponse = await fetch(initUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(videoBytes.length),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify(metadata),
  });

  if (!initResponse.ok) {
    const text = await initResponse.text();
    throw new Error(`YouTube upload init failed: ${initResponse.status} ${text.slice(0, 500)}`);
  }

  const uploadUrl = initResponse.headers.get("location");
  if (!uploadUrl) {
    throw new Error("YouTube upload init did not return a resumable upload URL.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBytes.length),
    },
    body: videoBytes,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`YouTube upload failed: ${uploadResponse.status} ${text.slice(0, 500)}`);
  }

  const uploaded = await uploadResponse.json();
  const videoId = uploaded?.id;
  const youtubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
  const result = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    uploadCallsMade: true,
    sourceEpisodeId: plan.sourceEpisode?.episodeId || "",
    sourceEpisodeTitle: stripHtml(plan.sourceEpisode?.title || metadata.snippet.title),
    sourceEpisodeDir: plan.sourceEpisode?.sourceEpisodeDir || "",
    videoId,
    youtubeUrl,
    privacyStatus: metadata.status.privacyStatus,
    videoPath,
    title: metadata.snippet.title,
    socialPostsMade: false,
  };

  await writeFile(uploadResultPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log("Growth Engineer Dashboard YouTube upload complete");
  console.log(`upload calls made: yes`);
  console.log(`privacy: ${result.privacyStatus}`);
  console.log(`YouTube URL: ${youtubeUrl}`);
  console.log(`social posts made: false`);
  console.log(`output path: ${uploadResultPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
