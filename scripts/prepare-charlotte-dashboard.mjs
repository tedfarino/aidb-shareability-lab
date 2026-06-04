import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const podcastRoot =
  process.env.CHARLOTTE_PODCAST_ROOT || "C:\\Users\\tedfa\\Documents\\personal_charlotte_podcast";
const reviewDir = path.join(podcastRoot, "output", "daily_review_dashboard");
const artifactsDir = path.join(reviewDir, "artifacts");
const telegramReviewDir = path.join(podcastRoot, "reviews", "telegram");
const rootOutputPath = path.join(repoRoot, "growth-dashboard-charlotte-import.json");
const legacyOutputPath = path.join(repoRoot, "growth-dashboard-charlotte-latest.json");
const publicOutputPath = path.join(repoRoot, "public", "growth-dashboard-charlotte-import.json");
const youtubeUploadResultPath = path.join(repoRoot, "growth-dashboard-youtube-upload-result.json");
const audiogramManifestPath = path.join(repoRoot, "growth-dashboard-youtube-audiogram.json");
const metricsSnapshotPath = path.join(repoRoot, "growth-dashboard-metrics-snapshot.json");

const linkedInMetricsPending =
  "LinkedIn metrics pending API approval. Publishing works; socialActions metrics are blocked by LinkedIn review.";

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return readFile(filePath, "utf8").then((text) => JSON.parse(text));
}

function readTextIfExists(filePath) {
  if (!existsSync(filePath)) {
    return "";
  }

  return readFile(filePath, "utf8");
}

function publicHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function normalize(value) {
  return String(value ?? "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slugify(value) {
  return String(value ?? "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function fileUrl(filePath) {
  if (!filePath) {
    return "";
  }

  return `file:///${filePath.replace(/\\/g, "/")}`;
}

function truncate(value, length = 220) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= length) {
    return clean;
  }

  return `${clean.slice(0, length - 1).trim()}...`;
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

async function fileSummary(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return { exists: false, path: filePath || "", sizeBytes: 0, modifiedAt: null };
  }

  const stats = await stat(filePath);
  return {
    exists: true,
    path: filePath,
    sizeBytes: stats.size,
    modifiedAt: stats.mtime.toISOString(),
  };
}

function buildEpisodeTitle(editorialPlan, segmentCards, scriptPreview) {
  const thesis = editorialPlan?.episode_thesis || "";
  if (thesis) {
    return "Who pays, who waits, and who owns the consequences?";
  }

  const firstMajor = segmentCards?.cards?.find((card) => card.role === "major");
  if (firstMajor?.title) {
    return firstMajor.title;
  }

  return truncate(scriptPreview, 80) || "Latest Charlotte Brief";
}

function gateState(isReady, isBlocked = false) {
  if (isReady) {
    return "ready";
  }
  if (isBlocked) {
    return "blocked";
  }
  return "waiting";
}

function buildPostDraft(segment, channel, preferredSocialUrl) {
  const hook = firstNonEmpty(segment.ted_take, segment.listener_stakes, segment.fact_summary, segment.title);
  const watch = segment.watch_item ? `\n\nWhat to watch: ${segment.watch_item}` : "";
  const cta = publicHttpUrl(preferredSocialUrl) ? `\n\nWatch/listen: ${preferredSocialUrl}` : "";

  if (channel === "X") {
    return truncate(`${hook}${watch}${cta}`, 270);
  }

  return truncate(`${hook}${watch}${cta}`, 900);
}

function workflowItem({
  id,
  episodeTitle,
  momentTitle,
  status,
  channel,
  owner,
  hook,
  publishWindow,
  sourceLink,
  postDraft,
  connectorState,
  platformPostUrl = "",
  views = 0,
  retentionRate = 0,
  replies = 0,
  clicks = 0,
  tractionScore = 0,
}) {
  return {
    id,
    episodeTitle,
    momentTitle,
    day: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date()),
    status,
    channel,
    owner,
    hook,
    publishWindow,
    sourceLink,
    postDraft,
    connectorState,
    platformPostUrl,
    views,
    retentionRate,
    replies,
    clicks,
    tractionScore,
  };
}

async function main() {
  if (!existsSync(reviewDir)) {
    throw new Error(`Charlotte daily review dashboard folder not found: ${reviewDir}`);
  }

  const [
    latestSummary,
    latestDelivery,
    latestDailyStatus,
    pipelineReport,
    editorialPlan,
    segmentCards,
    editorialAudit,
    episodeFlow,
    renderSummary,
    audiogramManifest,
    sources,
    youtubeUploadResult,
    metricsSnapshot,
    latestScript,
  ] = await Promise.all([
    readJsonIfExists(path.join(reviewDir, "latest_summary.json")),
    readJsonIfExists(path.join(telegramReviewDir, "latest_delivery.json")),
    readJsonIfExists(path.join(telegramReviewDir, "latest_daily_status.json")),
    readJsonIfExists(path.join(artifactsDir, "daily_script_pipeline_report.json")),
    readJsonIfExists(path.join(artifactsDir, "editorial_plan.json")),
    readJsonIfExists(path.join(artifactsDir, "segment_cards.json")),
    readJsonIfExists(path.join(artifactsDir, "editorial_audit.json")),
    readJsonIfExists(path.join(artifactsDir, "episode_flow_report.json")),
    readJsonIfExists(path.join(artifactsDir, "render_summary.json")),
    readJsonIfExists(audiogramManifestPath),
    readJsonIfExists(path.join(artifactsDir, "sources.json")),
    readJsonIfExists(youtubeUploadResultPath),
    readJsonIfExists(metricsSnapshotPath),
    readTextIfExists(path.join(reviewDir, "latest_script.txt")),
  ]);

  if (!latestSummary) {
    throw new Error(`Missing latest summary: ${path.join(reviewDir, "latest_summary.json")}`);
  }

  const dailyStatus = latestDailyStatus?.status || null;
  const dailyStatusSentAt = latestDailyStatus?.sent_at ? new Date(latestDailyStatus.sent_at).getTime() : 0;
  const latestDeliverySentAt = latestDelivery?.sent_at ? new Date(latestDelivery.sent_at).getTime() : 0;
  const hasNewerBlockedDailyStatus =
    latestDailyStatus?.status_kind === "qa_blocked" && dailyStatusSentAt > latestDeliverySentAt;

  const episodeDir = hasNewerBlockedDailyStatus
    ? dailyStatus?.episode_dir || ""
    : latestSummary.latest_episode_dir || pipelineReport?.episode_dir || "";
  const episodeId =
    (hasNewerBlockedDailyStatus ? dailyStatus?.episode_id : "") ||
    latestDelivery?.episode_id ||
    renderSummary?.episode_id ||
    editorialPlan?.episode_id ||
    sources?.episode_id ||
    path.basename(episodeDir);
  const audioPath = hasNewerBlockedDailyStatus
    ? ""
    : latestSummary.audio_path || latestDelivery?.audio_path || path.join(reviewDir, "latest_episode.mp3");
  const scriptReviewPath =
    latestDelivery?.script_review_path || path.join(reviewDir, "latest_script.html");
  const dashboardPath = latestDelivery?.dashboard_path || path.join(reviewDir, "latest.html");
  const scriptPath = path.join(reviewDir, "latest_script.txt");
  const scriptPreview = truncate(latestScript, 520);
  const episodeTitle = buildEpisodeTitle(editorialPlan, segmentCards, scriptPreview);
  const importedTitleFingerprint = normalize(`${episodeId} ${episodeTitle}`);
  const uploadedTitleFingerprint = normalize(
    `${youtubeUploadResult?.sourceEpisodeId || ""} ${youtubeUploadResult?.sourceEpisodeTitle || youtubeUploadResult?.title || ""}`,
  );
  const youtubeMatchesImportedEpisode =
    publicHttpUrl(youtubeUploadResult?.youtubeUrl) &&
    (youtubeUploadResult?.sourceEpisodeId === episodeId ||
      (uploadedTitleFingerprint && importedTitleFingerprint.includes(uploadedTitleFingerprint)));
  const youtubeEpisodeUrl = youtubeMatchesImportedEpisode ? youtubeUploadResult.youtubeUrl : "";
  const localAudiogramReady =
    audiogramManifest?.sourceEpisodeId === episodeId &&
    audiogramManifest?.outputPath &&
    existsSync(audiogramManifest.outputPath);
  const spotifyEpisodeUrl = process.env.CHARLOTTE_SPOTIFY_EPISODE_URL || "";
  const preferredSocialUrl = youtubeEpisodeUrl || spotifyEpisodeUrl || "";
  const socialReady = publicHttpUrl(preferredSocialUrl);
  const audio = await fileSummary(audioPath);
  const blockerText = hasNewerBlockedDailyStatus
    ? (dailyStatus?.blockers || []).join(", ") || "daily QA blocked"
    : "";
  const blockerLabel = hasNewerBlockedDailyStatus ? blockerText || "daily QA blocked" : "";
  const warningText = hasNewerBlockedDailyStatus ? (dailyStatus?.warnings || []).join(", ") : "";
  const durationTarget = hasNewerBlockedDailyStatus
    ? dailyStatus?.duration_target || {}
    : latestSummary.duration_target || {};
  const topSources =
    latestSummary.selected_stories?.slice(0, 8).map((story) => ({
      id: story.id,
      title: story.title,
      source: story.source,
      url: story.url,
      storyCluster: story.story_cluster,
      score: story.score,
    })) ||
    sources?.source_slots?.slice(0, 8).map((story) => ({
      id: story.id,
      title: story.title,
      source: story.source,
      url: story.url,
      storyCluster: story.story_cluster,
      score: story.score,
    })) ||
    [];
  const cards = segmentCards?.cards || [];
  const majorCards = cards.filter((card) => card.role === "major");
  const primarySegment = majorCards[0] || cards[0] || {};
  const secondSegment = majorCards[1] || primarySegment;
  const thirdSegment = majorCards[2] || secondSegment;
  const metricsById = new Map((metricsSnapshot?.metrics || []).map((item) => [item.id, item]));

  const workflowItems = [
    ...(hasNewerBlockedDailyStatus
      ? [
          workflowItem({
            id: `${episodeId}-daily-blocker`,
            episodeTitle: "Today's Charlotte Brief did not publish",
            momentTitle: "Daily run blocked",
            status: "Podcast Produced",
            channel: "Podcast",
            owner: "Podcast automation",
            hook: `Blocked: ${blockerText}`,
            publishWindow: "5:00 AM",
            sourceLink: fileUrl(dailyStatus?.source_packet_path || episodeDir),
            postDraft: `The morning automation stopped before render. Selected stories: ${
              dailyStatus?.selected_count ?? 0
            }. Accepted: ${dailyStatus?.accepted_count ?? 0}. Rejected: ${
              dailyStatus?.rejected_count ?? 0
            }. Warnings: ${warningText || "none"}.`,
            connectorState: "qa blocked - no public publishing",
          }),
        ]
      : []),
    workflowItem({
      id: `${episodeId}-podcast-review`,
      episodeTitle,
      momentTitle: "Listen to the finished episode",
      status:
        !hasNewerBlockedDailyStatus && latestSummary.pipeline_ok && latestSummary.render_ok && audio.exists
          ? "Review"
          : "Podcast Produced",
      channel: "Podcast",
      owner: "Ted listening review",
      hook: firstNonEmpty(editorialPlan?.episode_thesis, scriptPreview),
      publishWindow: "5:30 AM",
      sourceLink: fileUrl(dashboardPath),
      postDraft: "Private review package is ready. Approve only after listening.",
      connectorState: hasNewerBlockedDailyStatus
        ? "stale successful episode - today's run blocked"
        : latestDelivery?.telegram_called
          ? "telegram delivered"
          : "needs private review delivery",
    }),
    workflowItem({
      id: `${episodeId}-youtube-audiogram`,
      episodeTitle,
      momentTitle: "Create YouTube destination asset",
      status: youtubeEpisodeUrl ? "YouTube Ready" : "Review",
      channel: "YouTube",
      owner: "Dashboard asset prep",
      hook: firstNonEmpty(thirdSegment.title, episodeTitle),
      publishWindow: "11:30 AM",
      sourceLink: fileUrl(audioPath),
      postDraft: "Generate/upload a clean audiogram or video version. YouTube is the primary public URL for social posts.",
      connectorState: youtubeEpisodeUrl
        ? "ready"
        : hasNewerBlockedDailyStatus
          ? "blocked - today's podcast did not render"
          : localAudiogramReady
          ? "local MP4 ready - upload needed"
          : "needs current YouTube MP4 and URL",
      platformPostUrl: youtubeEpisodeUrl,
    }),
    workflowItem({
      id: `${episodeId}-linkedin-${slugify(primarySegment.segment_key || primarySegment.title || "analysis")}`,
      episodeTitle,
      momentTitle: firstNonEmpty(primarySegment.title, "LinkedIn analysis post"),
      status: "Review",
      channel: "LinkedIn",
      owner: "Ted approval",
      hook: firstNonEmpty(primarySegment.listener_stakes, primarySegment.ted_take, primarySegment.title),
      publishWindow: "Wed/Thu 4:00 PM",
      sourceLink: fileUrl(scriptReviewPath),
      postDraft: buildPostDraft(primarySegment, "LinkedIn", preferredSocialUrl),
      connectorState: hasNewerBlockedDailyStatus
        ? "blocked - today's podcast did not render"
        : socialReady
          ? "ready"
          : "blocked - YouTube or Spotify URL needed",
      ...metricsById.get(`${episodeId}-linkedin-${slugify(primarySegment.segment_key || primarySegment.title || "analysis")}`),
    }),
    workflowItem({
      id: `${episodeId}-x-${slugify(secondSegment.segment_key || secondSegment.title || "hook")}`,
      episodeTitle,
      momentTitle: firstNonEmpty(secondSegment.title, "X hook"),
      status: "Review",
      channel: "X",
      owner: "Ted approval",
      hook: firstNonEmpty(secondSegment.ted_take, secondSegment.listener_stakes, secondSegment.title),
      publishWindow: "7:45-9:15 AM next slot",
      sourceLink: fileUrl(scriptReviewPath),
      postDraft: buildPostDraft(secondSegment, "X", preferredSocialUrl),
      connectorState: hasNewerBlockedDailyStatus
        ? "blocked - today's podcast did not render"
        : socialReady
          ? "ready"
          : "blocked - YouTube or Spotify URL needed",
      ...metricsById.get(`${episodeId}-x-${slugify(secondSegment.segment_key || secondSegment.title || "hook")}`),
    }),
    workflowItem({
      id: `${episodeId}-spotify-tracking`,
      episodeTitle,
      momentTitle: "Track Spotify destination",
      status: spotifyEpisodeUrl ? "YouTube Ready" : "Review",
      channel: "Spotify",
      owner: "Destination tracking",
      hook: "Spotify is the secondary audio destination once the RSS feed is ingested there.",
      publishWindow: "After RSS.com ingestion",
      sourceLink: spotifyEpisodeUrl || "https://media.rss.com/the-charlotte-brief/feed.xml",
      postDraft: "Do not promote RSS.com as the public social CTA. Track Spotify once the episode URL exists.",
      connectorState: spotifyEpisodeUrl ? "ready" : "needs Spotify episode URL",
      platformPostUrl: spotifyEpisodeUrl,
    }),
  ];

  const readinessGate = [
    {
      id: "podcast-produced",
      label: "Podcast produced",
      state: gateState(latestSummary.pipeline_ok && latestSummary.render_ok && audio.exists),
      detail: hasNewerBlockedDailyStatus
        ? `${episodeId} blocked before render: ${blockerText}.`
        : `${episodeId} rendered and copied into the daily review dashboard.`,
    },
    {
      id: "human-listening-review",
      label: "Human listening review",
      state: "waiting",
      detail: hasNewerBlockedDailyStatus
        ? "Morning Telegram status reported QA blocked; there is no new listening package."
        : latestDelivery?.telegram_called
        ? "Private Telegram review package delivered. Public distribution still needs approval."
        : "Private listening delivery not confirmed yet.",
    },
    {
      id: "youtube-destination",
      label: "YouTube destination",
      state: gateState(publicHttpUrl(youtubeEpisodeUrl)),
      detail: hasNewerBlockedDailyStatus
        ? "Blocked because today's podcast run did not render audio."
        : youtubeEpisodeUrl
        ? "Current imported episode has a YouTube URL."
        : localAudiogramReady
          ? "Current episode MP4 exists locally. YouTube upload is still approval-gated."
          : "Needs a current YouTube MP4 and upload for this imported episode.",
    },
    {
      id: "preferred-social-url",
      label: "Preferred social URL",
      state: gateState(socialReady && !hasNewerBlockedDailyStatus, true),
      detail: hasNewerBlockedDailyStatus
        ? "Blocked: no current rendered episode to distribute."
        : socialReady
        ? "LinkedIn and X may use the preferred social URL after approval."
        : "Blocked: LinkedIn and X must wait for YouTube or Spotify.",
    },
    {
      id: "linkedin-metrics",
      label: "LinkedIn metrics",
      state: "waiting",
      detail: linkedInMetricsPending,
    },
  ];

  const connectors = [
    {
      channel: "YouTube",
      publish: "YouTube Data API upload",
      metrics: "YouTube Analytics API",
      state: youtubeEpisodeUrl ? "ready" : "ready - upload path available",
      note: youtubeEpisodeUrl ? "Current episode URL present." : "Needs current episode upload before social distribution.",
    },
    {
      channel: "X",
      publish: "X API post create",
      metrics: "X post analytics",
      state: socialReady ? "ready" : "blocked by missing preferredSocialUrl",
      note: "Connector works; live publish remains approval-gated.",
    },
    {
      channel: "LinkedIn",
      publish: "LinkedIn Posts API",
      metrics: "socialActions pending approval",
      state: socialReady ? "publish ready / metrics pending" : "blocked by missing preferredSocialUrl",
      note: linkedInMetricsPending,
    },
    {
      channel: "Spotify",
      publish: "RSS.com distribution",
      metrics: "Spotify listener metrics when available",
      state: spotifyEpisodeUrl ? "ready" : "pending episode URL",
      note: "RSS.com is infrastructure; Spotify is the public audio destination.",
    },
  ];

  const dashboardImport = {
    app: "Growth Engineer Dashboard",
    source: "personal_charlotte_podcast",
    podcastRoot,
    preparedAt: new Date().toISOString(),
    latestEpisode: {
      episodeId,
      title: hasNewerBlockedDailyStatus ? "Today's Charlotte Brief did not publish" : episodeTitle,
      show: "The Charlotte Brief",
      sourceEpisodeDir: episodeDir,
      latestRenderDir: latestSummary.latest_render_dir || renderSummary?.output_dir || "",
      dashboardPath,
      scriptReviewPath,
      scriptPath,
      audioPath,
      audio,
      producedAt: hasNewerBlockedDailyStatus ? latestDailyStatus.sent_at : latestDelivery?.sent_at || latestSummary?.latest_render_dir || null,
      summary: hasNewerBlockedDailyStatus
        ? `Blocked before publishing: ${blockerText}. Selected ${dailyStatus?.selected_count ?? 0}; accepted ${
            dailyStatus?.accepted_count ?? 0
          }; rejected ${dailyStatus?.rejected_count ?? 0}.`
        : firstNonEmpty(editorialPlan?.episode_thesis, scriptPreview),
      thesis: editorialPlan?.episode_thesis || "",
      hostPosition: editorialPlan?.host_position || "",
      scriptPreview,
      sourceCount: latestSummary.selected_stories?.length || pipelineReport?.draft?.source_count || 0,
      storyCount: durationTarget?.story_count || dailyStatus?.selected_count || latestSummary.selected_stories?.length || 0,
      durationMinutesEstimate: durationTarget?.estimated_minutes || null,
      qaStatus: {
        pipelineOk: hasNewerBlockedDailyStatus ? false : Boolean(latestSummary.pipeline_ok),
        renderOk: hasNewerBlockedDailyStatus ? false : Boolean(latestSummary.render_ok),
        renderMatchesEpisode: hasNewerBlockedDailyStatus ? false : Boolean(latestSummary.render_matches_episode),
        editorialAuditPass: hasNewerBlockedDailyStatus ? false : Boolean(editorialAudit?.pass),
        gates: hasNewerBlockedDailyStatus ? { source_packet: true, script_pipeline: false, render: false } : latestSummary.gates || {},
        blockers: [
          ...(hasNewerBlockedDailyStatus ? dailyStatus?.blockers || [] : []),
          ...(pipelineReport?.attempts?.flatMap((attempt) => attempt.blockers || []) || []),
          ...(editorialAudit?.blockers || []),
        ],
        warnings: hasNewerBlockedDailyStatus ? dailyStatus?.warnings || [] : [],
        dailyStatus: hasNewerBlockedDailyStatus ? dailyStatus : null,
      },
      reviewStatus: {
        telegramCalled: hasNewerBlockedDailyStatus
          ? Boolean(latestDailyStatus?.telegram_called)
          : Boolean(latestDelivery?.telegram_called),
        sentAt: hasNewerBlockedDailyStatus ? latestDailyStatus?.sent_at || "" : latestDelivery?.sent_at || "",
        approvalStatus: hasNewerBlockedDailyStatus
          ? `blocked - ${blockerLabel}`
          : "needs human listening approval before public distribution",
      },
      publishStatus: {
        approvedForPublic: false,
        rssFeedUrl: "https://media.rss.com/the-charlotte-brief/feed.xml",
        spotifyEpisodeUrl,
        youtubeEpisodeUrl,
        localAudiogramPath: localAudiogramReady ? audiogramManifest.outputPath : "",
        preferredSocialUrl,
        socialPublishBlocked: hasNewerBlockedDailyStatus || !socialReady,
        blockReason: hasNewerBlockedDailyStatus
          ? "Today's Charlotte Brief did not render; no public distribution should happen."
          : socialReady
            ? ""
            : "YouTube or Spotify episode URL needed before LinkedIn/X.",
      },
      topSources,
      segments: cards.map((card) => ({
        id: card.id,
        role: card.role,
        segmentKey: card.segment_key,
        title: card.title,
        tedTake: card.ted_take,
        listenerStakes: card.listener_stakes,
        watchItem: card.watch_item,
        sourceTitles: card.source_titles || [],
        clusters: card.clusters || [],
      })),
      episodeFlow: {
        pass: Boolean(episodeFlow?.pass),
        groups: episodeFlow?.groups || {},
        pivotCount: episodeFlow?.pivot_count || 0,
      },
    },
    readinessGate,
    connectors,
    workflowItems,
    safety: {
      publishCallsMade: false,
      uploadCallsMade: false,
      publicPostingRequiresApproval: true,
      linkedInAndXRequirePreferredSocialUrl: true,
      rssComIsInfrastructureOnly: true,
      apiKeyValuesPrinted: false,
    },
  };

  await mkdir(path.dirname(publicOutputPath), { recursive: true });
  await Promise.all([
    writeFile(rootOutputPath, `${JSON.stringify(dashboardImport, null, 2)}\n`),
    writeFile(legacyOutputPath, `${JSON.stringify(dashboardImport, null, 2)}\n`),
    writeFile(publicOutputPath, `${JSON.stringify(dashboardImport, null, 2)}\n`),
  ]);

  console.log("Growth Engineer Dashboard Charlotte import prepared");
  console.log(`episode id: ${episodeId}`);
  console.log(`daily status: ${hasNewerBlockedDailyStatus ? "blocked" : "latest successful render"}`);
  console.log(`podcast audio: ${audio.exists ? "present" : "missing"}`);
  console.log(`pipeline QA: ${hasNewerBlockedDailyStatus ? "blocked" : latestSummary.pipeline_ok ? "passed" : "blocked"}`);
  console.log(`render QA: ${hasNewerBlockedDailyStatus ? "blocked" : latestSummary.render_ok ? "passed" : "blocked"}`);
  console.log(`preferred social URL: ${socialReady ? "present" : "missing"}`);
  console.log("publish calls made: false");
  console.log(`output path: ${rootOutputPath}`);
  console.log(`app data path: ${publicOutputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
