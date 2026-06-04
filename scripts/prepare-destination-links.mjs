import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const charlotteImportPath = path.join(repoRoot, "growth-dashboard-charlotte-import.json");
const rssLatestPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-latest.json");
const youtubeUploadResultPath = path.join(repoRoot, "growth-dashboard-youtube-upload-result.json");
const outputPath = path.join(repoRoot, "growth-dashboard-destination-links.json");

function publicUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function normalize(value) {
  return String(value ?? "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function main() {
  const charlotteImport = existsSync(charlotteImportPath)
    ? JSON.parse(await readFile(charlotteImportPath, "utf8"))
    : null;
  const rssLatest = existsSync(rssLatestPath) ? JSON.parse(await readFile(rssLatestPath, "utf8")) : null;
  const youtubeUpload = existsSync(youtubeUploadResultPath)
    ? JSON.parse(await readFile(youtubeUploadResultPath, "utf8"))
    : null;
  const importedEpisode = charlotteImport?.latestEpisode || null;
  const uploadMatchesImportedEpisode =
    !importedEpisode ||
    youtubeUpload?.sourceEpisodeId === importedEpisode.episodeId ||
    (youtubeUpload?.sourceEpisodeTitle &&
      normalize(youtubeUpload.sourceEpisodeTitle) === normalize(importedEpisode.title));
  const links = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    rssComIsInfrastructure: true,
    rssFeedUrl: process.env.CHARLOTTE_FEED_URL || "https://media.rss.com/the-charlotte-brief/feed.xml",
    rssEpisodeUrl: process.env.CHARLOTTE_RSS_EPISODE_URL || rssLatest?.latestEpisode?.link || "",
    spotifyEpisodeUrl: process.env.CHARLOTTE_SPOTIFY_EPISODE_URL || "",
    youtubeEpisodeUrl:
      process.env.CHARLOTTE_YOUTUBE_EPISODE_URL ||
      (uploadMatchesImportedEpisode ? youtubeUpload?.youtubeUrl || "" : ""),
  };
  const preferredSocialUrl =
    process.env.CHARLOTTE_PREFERRED_SOCIAL_URL ||
    links.youtubeEpisodeUrl ||
    links.spotifyEpisodeUrl ||
    "";
  const report = {
    ...links,
    preferredSocialUrl,
    readiness: {
      importedEpisodeId: importedEpisode?.episodeId || "",
      youtubeUploadMatchesImportedEpisode: Boolean(uploadMatchesImportedEpisode && publicUrl(links.youtubeEpisodeUrl)),
      rssFeedReady: publicUrl(links.rssFeedUrl),
      rssEpisodeReady: publicUrl(links.rssEpisodeUrl),
      spotifyReady: publicUrl(links.spotifyEpisodeUrl),
      youtubeReady: publicUrl(links.youtubeEpisodeUrl),
      socialPublishingReady: publicUrl(preferredSocialUrl),
    },
    policy: {
      promotedDestinations: ["YouTube", "Spotify"],
      blockedDestinations: ["RSS.com as public social CTA"],
      linkedInAndXRule: "Require preferredSocialUrl before live posting.",
    },
  };

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log("Growth Engineer Dashboard destination links prepared");
  console.log(`RSS episode URL: ${report.readiness.rssEpisodeReady ? "present" : "missing"}`);
  console.log(`YouTube episode URL: ${report.readiness.youtubeReady ? "present" : "missing"}`);
  console.log(`Spotify episode URL: ${report.readiness.spotifyReady ? "present" : "missing"}`);
  console.log(`preferred social URL: ${report.readiness.socialPublishingReady ? "present" : "missing"}`);
  console.log(`output path: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
