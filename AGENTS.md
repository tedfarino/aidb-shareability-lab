# AIDB Audience Growth Lab Instructions

This repo is the AIDB audience-growth and creator-operations workspace at `C:\Users\tedfa\OneDrive\Documents\New project 2`.

## Purpose And Important Paths

- Main app: `src\main.tsx`
- Data: `src\data.ts`
- Styles: `src\styles.css`
- Local board persistence key: `aidb-post-operations-decisions`
- Current surface: `AIDB Audience Growth Lab`, `Post Operations`, `Board`, and `Week` views.

Keep product language audience-first: `audience growth`, `share moments`, and practical operator workflow visibility. Avoid overclaiming live integrations.

## Canonical Release Loop

PowerShell may block `npm run build` through `npm.ps1`; use `npm.cmd`.

```powershell
npm.cmd run build
git status --short
git add <narrow files>
git commit -m "<message>"
git push origin main
gh run watch
```

Then verify exact requested strings in the deployed hashed JS asset, not only the HTML shell.

## Default Work Loop

- Keep edits tiny and surgical.
- Inspect current dirty state before editing.
- Preserve local experiment artifacts unless Ted explicitly asks to remove or commit them.
- Do not commit generated media, OAuth logs, or local experiment artifacts unless explicitly requested.
- Use the Browser plugin for local Vite QA when visual behavior matters. Vite may bind to a fallback port; one verified local URL was `http://127.0.0.1:5175/aidb-shareability-lab/`.

## Done Means

- Build passes with `npm.cmd run build` when code changes affect the app.
- Git state is reviewed and only narrow intended files are staged.
- If publishing is requested, the push and GitHub Actions watch complete.
- Deployed verification checks the hashed JS asset for requested strings or behavior.
- If durable project state changes, update `C:\Users\tedfa\Documents\CodexVault\projects\aidb-audience-growth-lab.md` with concise evidence.
