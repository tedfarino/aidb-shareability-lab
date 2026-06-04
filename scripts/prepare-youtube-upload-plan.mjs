import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const charlotteImportPath = path.join(repoRoot, "growth-dashboard-charlotte-import.json");
const rssLatestPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-latest.json");
const outputPath = path.join(repoRoot, "growth-dashboard-youtube-upload-plan.json");
const assetDir = path.join(repoRoot, "charlotte-youtube-assets");
const legacyAudiogramPath = path.join(assetDir, "charlotte-pattern-problem-audiogram.mp4");
const defaultAudioPath =
  "\\\\wsl.localhost\\Ubuntu\\home\\tedfa\\personal_charlotte_podcast\\output\\2026-05-20_smoke_063001\\episode.mp3";

function slugify(value) {
  return String(value ?? "charlotte-brief")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function main() {
  const charlotteImport = existsSync(charlotteImportPath)
    ? JSON.parse(await readFile(charlotteImportPath, "utf8"))
    : null;
  const rssLatest = existsSync(rssLatestPath) ? JSON.parse(await readFile(rssLatestPath, "utf8")) : null;
  const importedEpisode = charlotteImport?.latestEpisode || null;
  const latestEpisode = rssLatest?.latestEpisode;
  const title = importedEpisode?.title || latestEpisode?.title || "Charlotte's Pattern Problem";
  const description =
    importedEpisode?.summary ||
    latestEpisode?.description ||
    "Charlotte is slowing down on toll lanes, data centers, and budget priorities. The useful question is whether the pause produces better rules, better numbers, and better alternatives.";
  const expectedAudiogramPath = importedEpisode?.episodeId
    ? path.join(assetDir, `${slugify(importedEpisode.episodeId)}-audiogram.mp4`)
    : legacyAudiogramPath;
  const audiogramPath =
    importedEpisode?.episodeId || existsSync(expectedAudiogramPath)
      ? expectedAudiogramPath
      : legacyAudiogramPath;
  const hasAudiogram = existsSync(audiogramPath);

  const plan = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    destination: "YouTube",
    status: hasAudiogram ? "ready - MP4 rendered" : "planned - render or video file needed",
    safety: {
      uploadCallsMade: false,
      requiresApproval: true,
      requiresExplicitExecutionFlag: "--execute-live",
      suggestedVisibility: "unlisted for smoke test, public after review",
    },
    sourceEpisode: {
      episodeId: importedEpisode?.episodeId || "",
      title,
      rssEpisodeUrl: latestEpisode?.link || "",
      rssAudioUrl: latestEpisode?.audioUrl || "",
      localAudioPath: process.env.CHARLOTTE_AUDIO_PATH || importedEpisode?.audioPath || defaultAudioPath,
      sourceEpisodeDir: importedEpisode?.sourceEpisodeDir || "",
      scriptPath: importedEpisode?.scriptPath || "",
    },
    videoAsset: {
      needed: !hasAudiogram,
      localPath: hasAudiogram ? audiogramPath : "",
      preferredFormat: "MP4",
      currentPlan:
        hasAudiogram
          ? "Upload the rendered branded audiogram MP4 to YouTube after approval."
          : "Create a simple branded audiogram or use a rendered vertical short, then upload with YouTube Data API.",
    },
    uploadDraft: {
      title,
      description: `${description}\n\nPodcast feed: https://media.rss.com/the-charlotte-brief/feed.xml`,
      tags: ["Charlotte", "Charlotte NC", "local news", "business", "infrastructure"],
      categoryId: "25",
      privacyStatus: "unlisted",
    },
  };

  await writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`);

  console.log("Growth Engineer Dashboard YouTube upload plan prepared");
  console.log(`title: ${title}`);
  console.log(`episode id: ${plan.sourceEpisode.episodeId || "unknown"}`);
  console.log(`rss episode URL: ${plan.sourceEpisode.rssEpisodeUrl ? "present" : "missing"}`);
  console.log(`video asset: ${hasAudiogram ? "present" : "needed"}`);
  console.log(`upload calls made: false`);
  console.log(`output path: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
