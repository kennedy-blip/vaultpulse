# VaultPulse

A Vite + React + TypeScript zero-knowledge secret-drop prototype for Vercel. The browser encrypts payloads with WebCrypto AES-GCM-256; the API stores ciphertext and IV only.

## Local development

```bash
npm install
npx vercel dev
```

Open the local URL printed by Vercel. Plain `npm run dev` serves the frontend but does not execute Vercel Functions; API actions show a graceful offline error.

## Deploy to Vercel

Import this repository, use the Vite framework preset, and deploy. Build command: `npm run build`; output directory: `dist`.

## Security / production readiness

**This repository is a prototype, not a production secret manager.** The API currently uses a process-local in-memory Map. Vercel functions are ephemeral and may run in separate instances, so data can disappear between requests and burn-after-read is not globally atomic. Before handling real secrets, replace `api/_store.ts` with a shared persistent store (for example Vercel KV/Redis or Postgres) and implement atomic get-and-delete / transaction semantics, authentication or abuse controls, payload limits, monitoring, and retention policies. Never commit real credentials. Share links contain the decryption key in the URL fragment; fragments are not sent in HTTP requests, but anyone possessing the full link can decrypt the secret.
