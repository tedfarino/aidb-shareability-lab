import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const assetDir = path.join(repoRoot, "charlotte-youtube-assets");
const charlotteImportPath = path.join(repoRoot, "growth-dashboard-charlotte-import.json");
const rssLatestPath = path.join(repoRoot, "growth-dashboard-charlotte-rss-latest.json");
const manifestPath = path.join(repoRoot, "growth-dashboard-youtube-audiogram.json");
const defaultAudioPath = path.join(repoRoot, "charlotte-rss-upload", "charlotte_pilot_004.mp3");

const ffmpegCandidates = [
  process.env.FFMPEG_PATH,
  "C:\\Users\\tedfa\\Downloads\\Capital\\review_videos\\node_modules\\@remotion\\compositor-win32-x64-msvc\\ffmpeg.exe",
  "ffmpeg",
].filter(Boolean);

function firstExistingCommand(candidates) {
  for (const candidate of candidates) {
    if (candidate === "ffmpeg" || existsSync(candidate)) {
      return candidate;
    }
  }
  return "";
}

function slugify(value) {
  return String(value ?? "charlotte-brief")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function truncate(value, length = 120) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= length) {
    return clean;
  }

  return `${clean.slice(0, length - 1).trim()}...`;
}

async function main() {
  const ffmpeg = firstExistingCommand(ffmpegCandidates);
  if (!ffmpeg) {
    throw new Error("FFmpeg not found. Set FFMPEG_PATH to ffmpeg.exe.");
  }
  await mkdir(assetDir, { recursive: true });

  const charlotteImport = existsSync(charlotteImportPath)
    ? JSON.parse(await readFile(charlotteImportPath, "utf8"))
    : null;
  const rssLatest = existsSync(rssLatestPath) ? JSON.parse(await readFile(rssLatestPath, "utf8")) : null;
  const importedEpisode = charlotteImport?.latestEpisode || {};
  const episodeId = importedEpisode.episodeId || "charlotte-brief";
  const safeEpisodeId = slugify(episodeId);
  const framePath = path.join(assetDir, `${safeEpisodeId}-frame.png`);
  const outputPath = path.join(assetDir, `${safeEpisodeId}-audiogram.mp4`);
  const downloadedAudioPath = path.join(assetDir, `${safeEpisodeId}-rss-audio.mp3`);
  const rssAudioUrl = rssLatest?.latestEpisode?.audioUrl || "";
  let audioPath = process.env.CHARLOTTE_AUDIO_PATH || importedEpisode.audioPath || "";
  let audioSource = process.env.CHARLOTTE_AUDIO_PATH ? "env" : audioPath ? "charlotte_import" : "";

  if (!audioPath && rssAudioUrl) {
    const response = await fetch(rssAudioUrl);
    if (!response.ok) {
      throw new Error(`Could not download RSS audio: ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(downloadedAudioPath, bytes);
    audioPath = downloadedAudioPath;
    audioSource = "rss";
  }

  if (!audioPath) {
    audioPath = defaultAudioPath;
    audioSource = "local";
  }

  if (!existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const primarySegment = importedEpisode.segments?.find((segment) => segment.role === "major");
  const frameSpecPath = path.join(assetDir, `${safeEpisodeId}-frame-spec.json`);
  await writeFile(
    frameSpecPath,
    `${JSON.stringify(
      {
        framePath,
        eyebrow: "CHARLOTTE BRIEF",
        title: importedEpisode.title || "The Charlotte Brief",
        subtitle:
          primarySegment?.title ||
          "Daily local signal for builders, operators, and civic adults",
        thesis: truncate(importedEpisode.thesis || importedEpisode.summary || "", 150),
        hostPosition: truncate(importedEpisode.hostPosition || primarySegment?.tedTake || "", 150),
        footer: "The Charlotte Brief | Daily local signal for builders, operators, and civic adults",
      },
      null,
      2,
    )}\n`,
  );

  const frameScriptPath = path.join(assetDir, `${safeEpisodeId}-make-frame.py`);
  await writeFile(
    frameScriptPath,
    String.raw`import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

spec = json.loads(Path(r"${frameSpecPath}").read_text(encoding="utf-8"))
out = Path(spec["framePath"])
W, H = 1920, 1080
img = Image.new("RGB", (W, H), "#101719")
draw = ImageDraw.Draw(img)

font_bold = "C:/Windows/Fonts/segoeuib.ttf"
font_regular = "C:/Windows/Fonts/segoeui.ttf"
brand = ImageFont.truetype(font_bold, 34)
title_font = ImageFont.truetype(font_bold, 78)
subtitle_font = ImageFont.truetype(font_regular, 40)
body = ImageFont.truetype(font_regular, 34)
small = ImageFont.truetype(font_regular, 30)

def wrap_text(text, font, max_width):
    words = str(text or "").split()
    lines = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        width = draw.textbbox((0, 0), candidate, font=font)[2]
        if width <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

draw.rectangle((0, 0, W, H), fill="#101719")
draw.rectangle((0, 0, W, 18), fill="#51C7F0")
draw.text((150, 78), spec["eyebrow"], font=brand, fill="#51C7F0")

y = 165
for line in wrap_text(spec["title"], title_font, 1450)[:2]:
    draw.text((150, y), line, font=title_font, fill="#FFFFFF")
    y += 92

y += 36
for line in wrap_text(spec["subtitle"], subtitle_font, 1450)[:2]:
    draw.text((150, y), line, font=subtitle_font, fill="#D9E6E8")
    y += 55

y += 18
for line in wrap_text(spec["thesis"], body, 1450)[:3]:
    draw.text((150, y), line, font=body, fill="#9EB4B9")
    y += 46

draw.rounded_rectangle((150, 640, 1770, 875), radius=22, fill="#172126", outline="#2C3D45", width=2)
for i in range(72):
    x = 205 + i * 21
    height = 28 + ((i * 37) % 112)
    y0 = 756 - height // 2
    y1 = 756 + height // 2
    color = "#51C7F0" if i % 3 else "#8DE7FF"
    draw.rounded_rectangle((x, y0, x + 8, y1), radius=4, fill=color)

draw.text((150, 945), spec["footer"], font=small, fill="#AFC0C4")
img.save(out)
`,
  );

  await execFileAsync("python", [frameScriptPath], { maxBuffer: 1024 * 1024 * 5 });

  await execFileAsync(
    ffmpeg,
    [
      "-y",
      "-loop",
      "1",
      "-i",
      framePath,
      "-i",
      audioPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-tune",
      "stillimage",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-shortest",
      outputPath,
    ],
    { maxBuffer: 1024 * 1024 * 20 },
  );

  const manifest = {
    app: "Growth Engineer Dashboard",
    preparedAt: new Date().toISOString(),
    sourceEpisodeId: episodeId,
    sourceEpisodeTitle: importedEpisode.title || "",
    outputPath,
    framePath,
    sourceAudioPath: audioPath,
    sourceAudioKind: audioSource,
    sourceRssAudioUrl: rssAudioUrl,
    format: {
      container: "mp4",
      resolution: "1920x1080",
      videoCodec: "h264",
      audioCodec: "aac",
      use: "YouTube upload asset",
    },
    safety: {
      youtubeUploadCallsMade: false,
      socialPostsMade: false,
    },
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log("Growth Engineer Dashboard YouTube audiogram rendered");
  console.log(`episode id: ${episodeId}`);
  console.log(`source audio: ${audioPath}`);
  console.log(`output path: ${outputPath}`);
  console.log("YouTube upload calls made: false");
  console.log("social posts made: false");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
