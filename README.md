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

The build runs strict TypeScript checking before creating the optimized Vite output in `dist`.

## Deploy to Vercel

1. Import `kennedy-blip/vaultpulse` from GitHub.
2. Select the Vite framework preset and keep the project root as `./`.
3. Use `npm install` as the install command.
4. Use `npm run build` as the build command.
5. Use `dist` as the output directory.
6. Deploy. Root-level TypeScript files in `api/` are detected as Vercel Functions.

The repository includes a Vercel SPA fallback rewrite and baseline security headers.

## Security and production readiness

**This repository is a prototype, not a production secret manager. Do not submit real credentials.** The API currently uses a process-local in-memory Map. Vercel Functions are ephemeral and may run in separate instances, so records can disappear between requests and burn-after-read is not globally atomic. Before using real secrets, replace `api/_store.ts` with a shared persistent store and implement atomic read-and-delete semantics, authentication or abuse controls, payload limits, monitoring, and retention policies.

The browser-generated decryption key is never sent to the API. Anyone who obtains the complete share link can decrypt its payload. Treat share links as sensitive, and avoid sharing them through public channels.
