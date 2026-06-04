import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const approvalPath = path.join(repoRoot, "growth-dashboard-approval-decisions.json");
const [id, status = "approved"] = process.argv.slice(2);
const allowed = new Set(["generated", "needs_review", "approved", "scheduled", "published", "measured"]);

async function main() {
  if (!id) {
    throw new Error("Usage: npm run approve:charlotte -- <queue-item-id> [approved|scheduled]");
  }
  if (!allowed.has(status)) {
    throw new Error(`Unsupported status: ${status}`);
  }

  const approvals = existsSync(approvalPath) ? JSON.parse(await readFile(approvalPath, "utf8")) : {};
  approvals[id] = {
    status,
    approvedAt: new Date().toISOString(),
    source: "operator",
  };

  await writeFile(approvalPath, `${JSON.stringify(approvals, null, 2)}\n`);

  console.log("Growth Engineer Dashboard approval saved");
  console.log(`item: ${id}`);
  console.log(`status: ${status}`);
  console.log(`output path: ${approvalPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
