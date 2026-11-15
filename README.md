# VaultPulse

VaultPulse is a Vite + React + TypeScript secret-drop prototype. The browser encrypts each payload with Web Crypto AES-GCM-256 before sending it to the API. The API receives ciphertext and the initialization vector only; the decryption key is placed in the URL fragment, which browsers do not send in HTTP requests.

## Requirements

- Node.js 20 or newer
- npm

## Local development

```bash
npm install
npx vercel dev
```

Use the local URL printed by Vercel. `npm run dev` starts only the Vite frontend; Vercel Functions require `vercel dev`.

## Checks and build

```bash
npm run check
npm run build
```

## Deploy to Vercel

Import `kennedy-blip/vaultpulse` from GitHub. Use the Vite preset, project root `./`, install command `npm install`, build command `npm run build`, and output directory `dist`. The API is a single root-level Vercel Function at `api/index.ts`, with operations selected by query string (`/api?op=health`, `/api?op=secrets`, and `/api?op=redeem`). The SPA fallback rewrite is intentionally omitted so it cannot intercept API requests; this app's share links use the root URL with query parameters.

## Security and production readiness

**This is a prototype, not a production secret manager. Do not submit real credentials.** The current API store is process-local memory. It may disappear on cold starts or differ across serverless instances, so records are not durable and burn-after-read is not globally atomic. Before using real secrets, connect a shared persistent database or Redis-compatible store and implement atomic read-and-delete semantics, authentication or abuse controls, payload limits, monitoring, and retention policies.

The browser-generated decryption key is never sent to the API. Anyone who obtains the complete share link can decrypt its payload. Treat share links as sensitive and avoid sharing them through public channels.
