import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const importPath = path.join(repoRoot, "growth-dashboard-charlotte-import.json");
const rssManifestPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-manifest.json");
const rssLatestPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-latest.json");
const approvalPath = path.join(repoRoot, "growth-dashboard-approval-decisions.json");
const destinationLinksPath = path.join(repoRoot, "growth-dashboard-destination-links.json");
const outputPath = path.join(repoRoot, "growth-dashboard-publish-queue.json");

function realPublicUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value) && !value.includes("example.com");
}

function queueStatusFromWorkflow(status) {
  const map = {
    "Podcast Produced": "generated",
    Review: "needs_review",
    "YouTube Ready": "approved",
    "Social Approved": "approved",
    Scheduled: "scheduled",
    Published: "published",
    Measured: "measured",
  };

  return map[status] || "generated";
}

function addSocialLink(body, preferredSocialUrl) {
  return realPublicUrl(preferredSocialUrl) ? `${body}\n\nWatch/listen: ${preferredSocialUrl}` : body;
}

function fallbackQueueItems() {
  return [
    {
      id: "charlotte-004-linkedin-i77-data-centers-budget",
      channel: "LinkedIn",
      status: "needs_review",
      publishAfterApproval: true,
      scheduledForLocal: "2026-05-20T16:00:00-04:00",
      timingRationale: "Legacy fallback item. Run npm run import:charlotte-latest to use the podcast pipeline.",
      sourceUrl:
        "https://www.wsoctv.com/news/local/ncdot-warns-charlotte-mayor-about-impact-rescinding-toll-lane-support/FZMU6TFVQZGHRE2CEMZCOK47VE/",
      body:
        "Charlotte keeps hitting pause on big decisions: I-77 toll lanes, data centers, budget priorities.\n\nThat can be responsible. Sometimes the right answer really is not yet.\n\nBut a pause only matters if the city uses the time to produce something better: clearer rules, better numbers, and real alternatives.\n\nThat is the pattern I am watching in this Charlotte Brief.",
    },
    {
      id: "charlotte-004-x-toll-lanes",
      channel: "X",
      status: "generated",
      publishAfterApproval: true,
      scheduledForLocal: "2026-05-20T09:15:00-04:00",
      timingRationale: "Legacy fallback item. Run npm run import:charlotte-latest to use the podcast pipeline.",
      sourceUrl:
        "https://www.wsoctv.com/news/local/charlotte-city-council-cancels-special-meeting-i-77-toll-lane-project/YQNJP2KTEJAKBNWZKHJWUHZ6FI/",
      body:
        "A veto is not a mobility plan. If the I-77 toll lane project dies, Charlotte still needs a funded alternative, a timeline, and a way to measure whether congestion actually improves.",
    },
  ];
}

function scheduleFor(channel) {
  if (channel === "LinkedIn") {
    return "next Wed/Thu 4:00 PM local";
  }
  if (channel === "X") {
    return "next 7:45-9:15 AM local";
  }
  if (channel === "YouTube") {
    return "after listening approval";
  }
  return "after destination URL exists";
}

async function main() {
  const latestImport = existsSync(importPath) ? JSON.parse(await readFile(importPath, "utf8")) : null;
  const rssManifest = existsSync(rssManifestPath) ? JSON.parse(await readFile(rssManifestPath, "utf8")) : null;
  const rssLatest = existsSync(rssLatestPath) ? JSON.parse(await readFile(rssLatestPath, "utf8")) : null;
  const approvals = existsSync(approvalPath) ? JSON.parse(await readFile(approvalPath, "utf8")) : {};
  const destinationLinks = existsSync(destinationLinksPath)
    ? JSON.parse(await readFile(destinationLinksPath, "utf8"))
    : null;
  const importedEpisode = latestImport?.latestEpisode || null;
  const rssEpisodeUrl =
    process.env.CHARLOTTE_RSS_EPISODE_URL ||
    rssLatest?.latestEpisode?.link ||
    (!rssLatest ? rssManifest?.publicLinks?.rssEpisodeUrl || rssManifest?.episode?.episodeUrl : "") ||
    "";
  const feedUrl =
    process.env.CHARLOTTE_FEED_URL ||
    rssManifest?.publicLinks?.rssFeedUrl ||
    rssManifest?.publicLinks?.feedUrl ||
    rssManifest?.feed?.feedUrl ||
    latestImport?.latestEpisode?.publishStatus?.rssFeedUrl ||
    "";
  const spotifyEpisodeUrl =
    process.env.CHARLOTTE_SPOTIFY_EPISODE_URL ||
    destinationLinks?.spotifyEpisodeUrl ||
    importedEpisode?.publishStatus?.spotifyEpisodeUrl ||
    rssManifest?.publicLinks?.spotifyEpisodeUrl ||
    "";
  const youtubeEpisodeUrl =
    process.env.CHARLOTTE_YOUTUBE_EPISODE_URL ||
    destinationLinks?.youtubeEpisodeUrl ||
    importedEpisode?.publishStatus?.youtubeEpisodeUrl ||
    rssManifest?.publicLinks?.youtubeEpisodeUrl ||
    "";
  const preferredSocialUrl =
    process.env.CHARLOTTE_PREFERRED_SOCIAL_URL ||
    destinationLinks?.preferredSocialUrl ||
    importedEpisode?.publishStatus?.preferredSocialUrl ||
    rssManifest?.publicLinks?.preferredSocialUrl ||
    youtubeEpisodeUrl ||
    spotifyEpisodeUrl ||
    "";
  const rssEpisodeReady = realPublicUrl(rssEpisodeUrl);
  const preferredSocialReady = realPublicUrl(preferredSocialUrl);
  const feedReady = realPublicUrl(feedUrl) && !rssManifest?.hostNeeded;
  const sourceWorkflowItems =
    latestImport?.workflowItems?.filter((item) => ["LinkedIn", "X", "YouTube"].includes(item.channel)) || [];
  const baseQueueItems =
    sourceWorkflowItems.length > 0
      ? sourceWorkflowItems.map((item) => ({
          id: item.id,
          channel: item.channel,
          status: queueStatusFromWorkflow(item.status),
          publishAfterApproval: true,
          scheduledForLocal: scheduleFor(item.channel),
          timingRationale:
            item.channel === "LinkedIn"
              ? "LinkedIn analysis slot. Publish only after listening approval and preferredSocialUrl."
              : item.channel === "X"
                ? "X gets the fast hook after the public destination URL exists."
                : "YouTube is the primary public destination before LinkedIn/X distribution.",
          sourceUrl: item.sourceLink || importedEpisode?.scriptReviewPath || "",
          title: item.channel === "YouTube" ? importedEpisode?.title : undefined,
          description:
            item.channel === "YouTube"
              ? `${importedEpisode?.summary || ""}\n\nRSS feed: ${feedUrl}`.trim()
              : undefined,
          body: item.postDraft || item.hook || "",
        }))
      : fallbackQueueItems();

  const queueItems = baseQueueItems.map((item) => {
    const requiresPreferredSocialUrl = item.channel === "LinkedIn" || item.channel === "X";
    const approval = approvals[item.id];
    const status = approval?.status || item.status;

    return {
      ...item,
      status,
      approvedAt: approval?.approvedAt || null,
      requiresPreferredSocialUrl,
      rssFeedUrl: feedReady ? feedUrl : "",
      rssEpisodeUrl: rssEpisodeReady ? rssEpisodeUrl : "",
      spotifyEpisodeUrl,
      youtubeEpisodeUrl,
      preferredSocialUrl: preferredSocialReady ? preferredSocialUrl : "",
      preferredSocialDestination: youtubeEpisodeUrl ? "YouTube" : spotifyEpisodeUrl ? "Spotify" : "",
      feedUrl: feedReady ? feedUrl : "",
      dependencyStatus: requiresPreferredSocialUrl
        ? preferredSocialReady
          ? "ready"
          : "blocked - YouTube or Spotify URL needed"
        : item.channel === "YouTube"
          ? "ready - upload remains separately approval-gated"
          : feedReady
            ? "ready"
            : "blocked - public RSS feed needed",
      body: requiresPreferredSocialUrl ? addSocialLink(item.body, preferredSocialUrl) : item.body,
    };
  });
  const queue = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    canonicalEpisode: {
      episodeId: importedEpisode?.episodeId || "",
      title: importedEpisode?.title || rssLatest?.latestEpisode?.title || "",
      rssFeedUrl: feedReady ? feedUrl : "needed: public podcast RSS feed URL",
      rssEpisodeUrl: rssEpisodeReady ? rssEpisodeUrl : "needed: RSS.com episode URL",
      spotifyEpisodeUrl: spotifyEpisodeUrl || "needed: Spotify episode URL",
      youtubeEpisodeUrl: youtubeEpisodeUrl || "needed: YouTube episode URL",
      preferredSocialUrl: preferredSocialReady ? preferredSocialUrl : "needed: YouTube or Spotify URL",
      hostNeeded: !feedReady || !rssEpisodeReady,
      socialPublishBlocked: !preferredSocialReady,
      latestRssEpisodeTitle: rssLatest?.latestEpisode?.title ?? null,
      publishingOrder: ["RSS feed", "Spotify ingestion", "YouTube upload", "LinkedIn/X distribution"],
    },
    sourceImport: latestImport
      ? {
          episodeId: importedEpisode?.episodeId,
          episodeFolder: importedEpisode?.sourceEpisodeDir,
          sourceCount: importedEpisode?.sourceCount,
          qaStatus: importedEpisode?.qaStatus,
          reviewStatus: importedEpisode?.reviewStatus,
        }
      : null,
    safety: {
      publishCallsMade: false,
      requiresExplicitApprovalState: true,
      livePublishCommandMustUse: "--allow-live-publish",
      requiresPreferredSocialUrlForSocialPosts: true,
      rssComIsInfrastructureOnly: true,
    },
    queue: queueItems,
  };

  await writeFile(outputPath, `${JSON.stringify(queue, null, 2)}\n`);

  console.log("Growth Engineer Dashboard publish queue prepared");
  console.log(`episode id: ${queue.canonicalEpisode.episodeId || "fallback"}`);
  console.log(`items: ${queue.queue.length}`);
  console.log(`RSS episode URL: ${rssEpisodeReady ? "present" : "missing"}`);
  console.log(`RSS feed URL: ${feedReady ? "present" : "missing"}`);
  console.log(`preferred social URL: ${preferredSocialReady ? "present" : "missing"}`);
  console.log("publish calls made: false");
  console.log("live publish guard: --allow-live-publish");
  console.log(`output path: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
