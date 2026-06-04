import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const model = "fal-ai/ltx-2.3/audio-to-video";
const endpoint = "https://fal.run/fal-ai/ltx-2.3/audio-to-video";
const estimatedCostPerSecondUsd = 0.1;
const testDurationSeconds = 19.23;
const outputPath = path.resolve("aidb-ltx-video-render-brief.json");
const selectedAudioDataUriPath = path.resolve(
  "ltx-audio-scratch/aidb-ltx-abundance-mix-v6.data-uri.txt",
);
const selectedAudioSourceMapPath = path.resolve(
  "ltx-audio-scratch/aidb-ltx-abundance-mix-v6-source-map.json",
);

const audioRequirement = "publicly accessible URL or base64 data URI, 2-20 seconds";
const selectedAudioDataUri = (await readFile(selectedAudioDataUriPath, "utf8")).trim();

const brief = {
  requestDraft: {
    model,
    endpoint,
    estimatedCostPerSecondUsd,
    input: {
      audio_url: selectedAudioDataUri,
      prompt:
        "Create a vertical social video for an AI podcast clip about AI expanding human capacity into a future of abundance. Let the audio drive the sequence creatively: begin with a polished podcast/news analysis feel, then move through optimistic future visuals including humanoid robotics, clean energy, healthcare, food and water systems, education, and productive organizations moving faster. Use cinematic motion, varied scenes, and a premium tech-news social style. Do not show filenames, file paths, local computer text, debug text, fake logos, readable invented UI text, misleading brand marks, or generated captions.",
      aspect_ratio: "9:16",
    },
  },
  selectedSourceAudio: {
    clipName: "aidb-ltx-abundance-mix-v6.mp3",
    durationSecondsApprox: testDurationSeconds,
    localDataUriPath: selectedAudioDataUriPath,
    sourceMapPath: selectedAudioSourceMapPath,
    editorialFit:
      "AIDB frames AI as expanding human and organizational capacity; Diamandis extends the same idea into the coming age of abundance.",
  },
  sourceAudioRequirements: {
    durationSecondsMin: 2,
    durationSecondsMax: 20,
    acceptedAudioInput: "publicly accessible URL or base64 data URI",
  },
  approvalStatus: "ready for manual render approval",
  nextMissingInput: "manual approval to call fal.ai",
  measurementPlan: ["views", "retention proxy", "replies", "clicks after 24h"],
};

await writeFile(outputPath, `${JSON.stringify(brief, null, 2)}\n`, "utf8");

const hasFalKey = Boolean(process.env.FAL_KEY);
const estimatedTestCostUsd = estimatedCostPerSecondUsd * testDurationSeconds;

console.log(`FAL_KEY ${hasFalKey ? "present" : "missing"}`);
console.log(`model id: ${model}`);
console.log(`audio requirement: ${audioRequirement}`);
console.log(`source audio selected: aidb-ltx-abundance-mix-v6.mp3 (${testDurationSeconds}s)`);
console.log(
  `estimated cost for a ${testDurationSeconds} second test: $${estimatedTestCostUsd.toFixed(2)}`,
);
console.log(`output path: ${outputPath}`);
