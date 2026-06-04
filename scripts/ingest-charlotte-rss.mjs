import { writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const feedUrl = process.env.CHARLOTTE_FEED_URL || "https://media.rss.com/the-charlotte-brief/feed.xml";
const outputPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-latest.json");

function textBetween(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return cleanXml(match?.[1] ?? "");
}

function attrValue(value, attr) {
  const match = value.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
  return cleanXml(match?.[1] ?? "");
}

function cleanXml(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .trim();
}

function firstItem(xml) {
  const match = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/i);
  if (!match) {
    return null;
  }

  const itemXml = match[1];
  const enclosureMatch = itemXml.match(/<enclosure\b[^>]*>/i);
  const enclosure = enclosureMatch?.[0] ?? "";

  return {
    title: textBetween(itemXml, "title"),
    link: textBetween(itemXml, "link"),
    guid: textBetween(itemXml, "guid"),
    description: textBetween(itemXml, "description"),
    pubDate: textBetween(itemXml, "pubDate"),
    audioUrl: attrValue(enclosure, "url"),
    audioType: attrValue(enclosure, "type"),
    audioBytes: Number(attrValue(enclosure, "length")) || null,
  };
}

async function main() {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "Growth Engineer Dashboard RSS ingest",
    },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  const latestEpisode = firstItem(xml);
  const report = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    feedUrl,
    podcast: {
      title: textBetween(xml, "title"),
      link: textBetween(xml, "link"),
      description: textBetween(xml, "description"),
      language: textBetween(xml, "language"),
    },
    latestEpisode,
    readiness: {
      feedReachable: true,
      hasEpisode: Boolean(latestEpisode),
      hasPublicEpisodeUrl: Boolean(latestEpisode?.link),
      hasAudioUrl: Boolean(latestEpisode?.audioUrl),
    },
  };

  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log("Growth Engineer Dashboard RSS ingest complete");
  console.log(`feed reachable: yes`);
  console.log(`latest episode: ${latestEpisode?.title || "missing"}`);
  console.log(`episode URL: ${latestEpisode?.link ? "present" : "missing"}`);
  console.log(`audio URL: ${latestEpisode?.audioUrl ? "present" : "missing"}`);
  console.log(`output path: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
