import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const allowPaidRender = process.argv.includes("--allow-paid-render");
const briefPath = path.resolve("aidb-ltx-video-render-brief.json");
const outputPath = path.resolve("aidb-ltx-video-render-response.json");

if (!allowPaidRender) {
  console.error("Refusing to call fal.ai without --allow-paid-render.");
  console.error("Usage: npm run render:ltx -- --allow-paid-render");
  process.exit(1);
}

if (!process.env.FAL_KEY) {
  console.error("Refusing to call fal.ai because FAL_KEY is missing.");
  process.exit(1);
}

const brief = JSON.parse(await readFile(briefPath, "utf8"));
const { endpoint, input } = brief.requestDraft;

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
  model: brief.requestDraft.model,
  endpoint,
  requestedAt: new Date().toISOString(),
  body,
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

if (!response.ok) {
  console.error(`fal.ai request failed: ${response.status} ${response.statusText}`);
  console.error(`response written to: ${outputPath}`);
  process.exit(1);
}

console.log(`fal.ai request succeeded: ${response.status} ${response.statusText}`);
console.log(`response written to: ${outputPath}`);
