import { writeFile } from "node:fs/promises";
import path from "node:path";

const allowPaidRender = process.argv.includes("--allow-paid-render");
const model = "fal-ai/bytedance/seedance/v1/pro/fast/text-to-video";
const endpoint = "https://fal.run/fal-ai/bytedance/seedance/v1/pro/fast/text-to-video";
const outputPath = path.resolve("aidb-seedance-visual-test-response.json");

if (!allowPaidRender) {
  console.error("Refusing to call fal.ai without --allow-paid-render.");
  console.error("Usage: npm run render:seedance -- --allow-paid-render");
  process.exit(1);
}

if (!process.env.FAL_KEY) {
  console.error("Refusing to call fal.ai because FAL_KEY is missing.");
  process.exit(1);
}

const transcriptContext = [
  "People can clearly achieve way more than they did before.",
  "Organizations can move farther, faster.",
  "The coming age of abundance.",
  "Technologies including AI and humanoid robotics are creating a world of abundance.",
  "Uplifting humanity across food, water, healthcare, and education.",
].join(" ");

const prompt = [
  "Vertical 9:16 social video for X, hyper-realistic cinematic tech-news mini documentary, no on-screen text.",
  "Use the transcript as story meaning, not as visible captions:",
  transcriptContext,
  "Storyboard the video as a sequence of realistic live-action visual beats:",
  "1. A real modern podcast/news analysis studio, shallow depth of field, practical lights, believable camera movement.",
  "2. Real office and lab environments where professionals use AI tools to multiply output; show screens only as soft abstract light, no readable text.",
  "3. Real factories, logistics centers, robotics labs, and clean infrastructure moving faster with human teams and humanoid robots working safely alongside people.",
  "4. Transition into Peter Diamandis-style abundance: real-world near-future scenes of clean energy fields, desalination and water systems, healthcare robotics, food production, classrooms, and a bright livable city.",
  "Style: photorealistic, live-action documentary, premium commercial cinematography, believable near future, optimistic but grounded, realistic humans, natural lighting, smooth multi-shot narrative coherence.",
  "Avoid: anime, animation, cartoon, illustration, painting, 3D render look, CGI look, game cinematic, sci-fi fantasy, cyberpunk neon overload, captions, subtitles, logos, brand marks, filenames, file paths, debug text, readable UI, distorted letters, fake news tickers, QR codes, watermarks, uncanny faces, cluttered infographics.",
].join(" ");

const input = {
  prompt,
  aspect_ratio: "9:16",
  resolution: "720p",
  duration: "12",
  camera_fixed: false,
  enable_safety_checker: true,
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
  input,
  body,
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

if (!response.ok) {
  console.error(`Seedance request failed: ${response.status} ${response.statusText}`);
  console.error(`response written to: ${outputPath}`);
  process.exit(1);
}

console.log(`Seedance request succeeded: ${response.status} ${response.statusText}`);
console.log(`response written to: ${outputPath}`);
