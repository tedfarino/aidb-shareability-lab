import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const allowPaidRender = process.argv.includes("--allow-paid-render");
const model = "bytedance/seedance-2.0/fast/reference-to-video";
const endpoint = "https://fal.run/bytedance/seedance-2.0/fast/reference-to-video";
const outputPath = path.resolve("aidb-seedance2-reference-test-response.json");
const audioDataUriPath = path.resolve("ltx-audio-scratch/aidb-v6-first-8s-for-seedance2.data-uri.txt");
const videoReferenceDataUriPath = path.resolve("reference-bmx-ai-workflow-8s-540p.data-uri.txt");

if (!allowPaidRender) {
  console.error("Refusing to call fal.ai without --allow-paid-render.");
  console.error("Usage: npm run render:seedance2 -- --allow-paid-render");
  process.exit(1);
}

if (!process.env.FAL_KEY) {
  console.error("Refusing to call fal.ai because FAL_KEY is missing.");
  process.exit(1);
}

const audioDataUri = (await readFile(audioDataUriPath, "utf8")).trim();
const videoReferenceDataUri = (await readFile(videoReferenceDataUriPath, "utf8")).trim();

const input = {
  prompt:
    "Create a vertical cinematic social video for X from @Audio1. Use @Video1 only as a loose visual reference for the filmmaking language: photoreal live-action, soft daylight, modern institutional interiors, shallow depth of field, slow dolly/push-in camera moves, close-ups of real people thinking and working, clean labs and offices, and a polished AI-generated short-film feeling. Do not copy the exact people, classroom, framing, or story from the reference. The spoken idea is that AI lets people achieve way more, organizations move farther faster, and this points toward an age of abundance. Build a coherent abundance-future storyboard: knowledge workers amplified by AI, a modern operations/lab environment, humanoid robotics assisting people, clean energy, water systems, healthcare, education, and optimistic real-world progress. Make it look like filmed reality, not anime, cartoon, illustration, CGI, or a game cinematic. No captions, no subtitles, no filenames, no file paths, no debug text, no readable UI, no logos, no QR codes, no watermark.",
  video_urls: [videoReferenceDataUri],
  audio_urls: [audioDataUri],
  resolution: "720p",
  duration: "8",
  aspect_ratio: "9:16",
  generate_audio: false,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Key ${process.env.FAL_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(input),
});

const text = await response.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = { raw: text };
}

const result = {
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  model,
  endpoint,
  requestedAt: new Date().toISOString(),
  input: {
    ...input,
    audio_urls: [`${audioDataUri.slice(0, 22)}...(${audioDataUri.length} chars)`],
    video_urls: [`${videoReferenceDataUri.slice(0, 21)}...(${videoReferenceDataUri.length} chars)`],
  },
  body,
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

if (!response.ok) {
  console.error(`Seedance 2.0 request failed: ${response.status} ${response.statusText}`);
  console.error(`response written to: ${outputPath}`);
  process.exit(1);
}

console.log(`Seedance 2.0 request succeeded: ${response.status} ${response.statusText}`);
console.log(`response written to: ${outputPath}`);
