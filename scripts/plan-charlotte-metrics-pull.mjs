import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const queuePath = path.join(repoRoot, "growth-dashboard-publish-queue.json");
const rssManifestPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-manifest.json");
const outputPath = path.join(repoRoot, "growth-dashboard-metrics-pull-plan.json");

async function main() {
  if (!existsSync(queuePath)) {
    throw new Error("Publish queue missing. Run npm run prepare:charlotte-publish first.");
  }

  const publishQueue = JSON.parse(await readFile(queuePath, "utf8"));
  const rssManifest = existsSync(rssManifestPath) ? JSON.parse(await readFile(rssManifestPath, "utf8")) : null;
  const now = new Date();
  const checkpoints = [1, 6, 24, 72];

  const metricsPlan = {
    app: "Growth Engineer Dashboard",
    preparedAt: now.toISOString(),
    sourceQueueItems: publishQueue.queue.length,
    safety: {
      metricsCallsMade: false,
      notes: "This is a collection plan only. It does not call RSS hosting, Spotify, LinkedIn, X, or YouTube.",
    },
    canonicalEpisode: {
      rssFeedUrl:
        publishQueue.canonicalEpisode?.rssFeedUrl ??
        publishQueue.canonicalEpisode?.feedUrl ??
        rssManifest?.publicLinks?.feedUrl ??
        rssManifest?.publicLinks?.rssFeedUrl ??
        rssManifest?.feed?.feedUrl ??
        "unknown",
      rssEpisodeUrl:
        publishQueue.canonicalEpisode?.rssEpisodeUrl ??
        publishQueue.canonicalEpisode?.episodeUrl ??
        rssManifest?.publicLinks?.rssEpisodeUrl ??
        rssManifest?.episode?.episodeUrl ??
        "unknown",
      spotifyEpisodeUrl: publishQueue.canonicalEpisode?.spotifyEpisodeUrl ?? "needed",
      youtubeEpisodeUrl: publishQueue.canonicalEpisode?.youtubeEpisodeUrl ?? "needed",
      preferredSocialUrl: publishQueue.canonicalEpisode?.preferredSocialUrl ?? "needed",
      hostNeeded: Boolean(publishQueue.canonicalEpisode?.hostNeeded ?? rssManifest?.hostNeeded),
      funnel: ["RSS feed", "Spotify", "YouTube", "LinkedIn", "X"],
    },
    collectionWindows: checkpoints.map((hours) => ({
      label: `${hours}h`,
      afterPublishHours: hours,
      metrics: [
        "rss_or_platform_plays",
        "views_or_impressions",
        "listen_or_watch_retention_proxy",
        "replies_or_comments",
        "clicks_to_episode",
      ],
    })),
    platformMetrics: {
      RSS: ["episode_downloads", "unique_listeners_if_host_supports_it", "feed_subscribers_if_available"],
      Spotify: ["starts", "streams", "listeners", "followers", "completion_rate_proxy"],
      YouTube: ["views", "average_view_duration", "likes", "comments", "traffic_source_clicks"],
      LinkedIn: ["impressions", "reactions", "comments", "shares", "clicks_to_episode_url"],
      X: ["impressions", "likes", "replies", "reposts", "url_link_clicks"],
    },
    successModel: {
      primary: "episode listens or YouTube views attributable to LinkedIn/X distribution",
      secondary: ["comment quality", "profile follows", "repeat topic performance", "click-through to source episode"],
      decisionRule:
        "Double down on topics with above-median retention and comments; rewrite hooks for high-impression low-click posts.",
    },
    posts: publishQueue.queue.map((item) => ({
      id: item.id,
      channel: item.channel,
      status: item.status,
      scheduledForLocal: item.scheduledForLocal,
      dependencyStatus: item.dependencyStatus,
      rssEpisodeUrl: item.rssEpisodeUrl || item.episodeUrl || "",
      preferredSocialUrl: item.preferredSocialUrl || "",
      requiredAfterPublishPulls: checkpoints.map((hours) => `${hours}h`),
    })),
  };

  await writeFile(outputPath, `${JSON.stringify(metricsPlan, null, 2)}\n`);

  console.log("Growth Engineer Dashboard metrics pull plan prepared");
  console.log(`posts: ${metricsPlan.posts.length}`);
  console.log(`canonical host needed: ${metricsPlan.canonicalEpisode.hostNeeded ? "yes" : "no"}`);
  console.log(`windows: ${checkpoints.join("h, ")}h`);
  console.log(`metrics calls made: false`);
  console.log(`output path: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
