# AIDB Shareability Lab

A small growth-engineering prototype for the AI Daily Brief Growth Engineer application.

Live demo: https://tedfarino.github.io/aidb-shareability-lab/

The lab maps May 2026 AIDB episodes to:

- shareable moments
- likely sharers
- likely recipients
- the reason a moment travels
- reusable packaging for Slack, email, LinkedIn, and executive memos
- a simple scoring rubric for shareability

## Why This Exists

The role is about making AIDB easier to share. This project is the first version of that system: a lightweight way to turn strong episode analysis into forwarding objects listeners can use inside companies, communities, and social channels.

## Stack

- Vite
- React
- TypeScript
- Static hosting

No backend is required for the first version. That keeps the project cheap, portable, and easy to deploy to GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Deployment

The included GitHub Actions workflow builds the app and publishes `dist/` to GitHub Pages.
