import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

function charlotteLiveImportPlugin() {
  const repoRoot = process.cwd();
  const podcastRoot =
    process.env.CHARLOTTE_PODCAST_ROOT || "C:\\Users\\tedfa\\Documents\\personal_charlotte_podcast";
  const sourceStatusPath = path.join(podcastRoot, "reviews", "telegram", "latest_daily_status.json");
  const sourceDeliveryPath = path.join(podcastRoot, "reviews", "telegram", "latest_delivery.json");
  const importOutputPath = path.join(repoRoot, "public", "growth-dashboard-charlotte-import.json");
  const importScriptPath = path.join(repoRoot, "scripts", "prepare-charlotte-dashboard.mjs");
  let lastImportAttempt = 0;

  function latestSourceModifiedAt() {
    return [sourceStatusPath, sourceDeliveryPath]
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => statSync(filePath).mtimeMs)
      .reduce((latest, modifiedAt) => Math.max(latest, modifiedAt), 0);
  }

  function refreshImportIfNeeded() {
    const now = Date.now();
    if (now - lastImportAttempt < 2000) {
      return;
    }

    lastImportAttempt = now;
    const sourceModifiedAt = latestSourceModifiedAt();
    const outputModifiedAt = existsSync(importOutputPath) ? statSync(importOutputPath).mtimeMs : 0;

    if (!sourceModifiedAt || outputModifiedAt >= sourceModifiedAt) {
      return;
    }

    execFileSync(process.execPath, [importScriptPath], {
      cwd: repoRoot,
      env: process.env,
      stdio: "ignore",
    });
  }

  return {
    name: "charlotte-live-import",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (
          req.url?.includes("growth-dashboard-charlotte-import.json") ||
          req.url === "/aidb-shareability-lab/" ||
          req.url === "/"
        ) {
          try {
            refreshImportIfNeeded();
          } catch (error) {
            server.config.logger.warn(
              `[charlotte-live-import] Failed to refresh Charlotte import: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: "/aidb-shareability-lab/",
  plugins: [charlotteLiveImportPlugin(), react()],
});
