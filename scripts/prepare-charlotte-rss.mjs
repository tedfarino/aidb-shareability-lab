import { existsSync } from "node:fs";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const importPath = path.join(repoRoot, "growth-dashboard-charlotte-latest.json");
const rssPath = path.join(repoRoot, "growth-dashboard-charlotte-feed.xml");
const manifestPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-manifest.json");
const publicBaseUrl = process.env.CHARLOTTE_PUBLIC_BASE_URL || "https://example.com/charlotte-brief";
const externalFeedUrl = process.env.CHARLOTTE_FEED_URL || "https://media.rss.com/the-charlotte-brief/feed.xml";
const externalRssEpisodeUrl = process.env.CHARLOTTE_RSS_EPISODE_URL || "";
const externalSpotifyEpisodeUrl = process.env.CHARLOTTE_SPOTIFY_EPISODE_URL || "";
const externalYoutubeEpisodeUrl = process.env.CHARLOTTE_YOUTUBE_EPISODE_URL || "";
const preferredSocialUrl = externalYoutubeEpisodeUrl || externalSpotifyEpisodeUrl;
const audioPath =
  process.env.CHARLOTTE_AUDIO_PATH ||
  "\\\\wsl.localhost\\Ubuntu\\home\\tedfa\\personal_charlotte_podcast\\output\\2026-05-20_smoke_063001\\episode.mp3";

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc2822(date) {
  return new Date(date).toUTCString();
}

async function main() {
  const latestImport = existsSync(importPath) ? JSON.parse(await readFile(importPath, "utf8")) : null;
  const episodeId = latestImport?.latestEpisode?.episodeId ?? "charlotte_pilot_004";
  const audioExists = existsSync(audioPath);
  const audioStats = audioExists ? await stat(audioPath) : null;
  const title = "Charlotte's Pattern Problem";
  const description =
    "Charlotte is slowing down on toll lanes, data centers, and budget priorities. The useful question is whether the pause produces better rules, better numbers, and better alternatives.";
  const slug = episodeId.replace(/_/g, "-");
  const episodeUrl = `${publicBaseUrl}/episodes/${slug}`;
  const audioUrl = `${publicBaseUrl}/audio/${slug}.mp3`;
  const feedUrl = `${publicBaseUrl}/feed.xml`;
  const pubDate = rfc2822(latestImport?.latestEpisode?.createdAt ?? new Date());

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>The Charlotte Brief</title>
    <link>${escapeXml(publicBaseUrl)}</link>
    <description>Local Charlotte stories with the practical question City Hall usually skips: what does this actually change?</description>
    <language>en-us</language>
    <itunes:author>Ted Farino</itunes:author>
    <itunes:explicit>false</itunes:explicit>
    <item>
      <guid isPermaLink="false">${escapeXml(episodeId)}</guid>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(episodeUrl)}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${audioStats?.size ?? 0}" type="audio/mpeg" />
      <itunes:episodeType>full</itunes:episodeType>
    </item>
  </channel>
</rss>
`;

  const manifest = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    podcast: "The Charlotte Brief",
    episode: {
      episodeId,
      title,
      description,
      episodeUrl,
      audioUrl,
      localAudioPath: audioPath,
      localAudioExists: audioExists,
      localAudioBytes: audioStats?.size ?? null,
      rssGuid: episodeId,
      pubDate,
    },
    feed: {
      localPath: rssPath,
      intendedPublicUrl: feedUrl,
      feedUrl: externalFeedUrl,
      hostNeeded: false,
    },
    publicLinks: {
      rssFeedUrl: externalFeedUrl,
      rssEpisodeUrl: externalRssEpisodeUrl,
      spotifyEpisodeUrl: externalSpotifyEpisodeUrl,
      youtubeEpisodeUrl: externalYoutubeEpisodeUrl,
      preferredSocialUrl,
    },
    distribution: {
      rssCom: "canonical feed infrastructure only",
      spotify: "audio destination once Spotify ingests the RSS episode",
      youtube: "primary public social destination",
      linkedinAndX: "block publishing until preferredSocialUrl exists",
    },
  };

  await writeFile(rssPath, rss);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log("Growth Engineer Dashboard RSS feed prepared");
  console.log(`episode id: ${episodeId}`);
  console.log(`local audio present: ${audioExists ? "yes" : "no"}`);
  console.log(`host needed: ${manifest.feed.hostNeeded ? "yes" : "no"}`);
  console.log(`public RSS feed: ${externalFeedUrl}`);
  console.log(`rss path: ${rssPath}`);
  console.log(`manifest path: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
