import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";

type VaultRecord = {
  secretId: string;
  ciphertext: string;
  iv: string;
  burnAfterRead: boolean;
  createdAt: number;
  expiresAt: number;
};

type VaultStore = Map<string, VaultRecord>;
const runtime = globalThis as typeof globalThis & { __vaultPulseStore?: VaultStore };
const vaults = runtime.__vaultPulseStore ?? new Map<string, VaultRecord>();
runtime.__vaultPulseStore = vaults;

function pruneExpired(now = Date.now()) {
  for (const [id, vault] of vaults) {
    if (vault.expiresAt <= now) vaults.delete(id);
  }
}

function parseBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === "string") {
    try {
      const parsed: unknown = JSON.parse(body);
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
  return body && typeof body === "object" ? body as Record<string, unknown> : null;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const url = new URL(req.url ?? "/api", "https://vaultpulse.local");
  const operation = url.searchParams.get("op") ?? "secrets";

  if (req.method === "GET" && operation === "health") {
    pruneExpired();
    return res.status(200).json({
      ok: true,
      service: "vaultpulse-api",
      storage: "ephemeral-memory",
      count: vaults.size,
    });
  }

  if (req.method === "GET" && operation === "secrets") {
    pruneExpired();
    const active = [...vaults.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ secretId, burnAfterRead, createdAt, expiresAt }) => ({
        secretId, burnAfterRead, createdAt, expiresAt, status: "active",
      }));
    return res.status(200).json({
      vaults: active,
      count: active.length,
      storage: "ephemeral-memory",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ error: "Request body must be valid JSON.", code: "INVALID_JSON" });
  }

  if (operation === "secrets") {
    const ciphertext = body.ciphertext;
    const iv = body.iv;
    const burnAfterRead = body.burnAfterRead === true;
    const ttlSeconds = Number(body.ttlSeconds ?? 3600);

    if (typeof ciphertext !== "string" || ciphertext.length < 16 || ciphertext.length > 1_500_000 ||
        typeof iv !== "string" || iv.length < 8 || iv.length > 128) {
      return res.status(400).json({ error: "Valid ciphertext and IV are required.", code: "INVALID_PAYLOAD" });
    }
    if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 604800) {
      return res.status(400).json({ error: "TTL must be between 60 seconds and 7 days.", code: "INVALID_TTL" });
    }

    pruneExpired();
    const secretId = randomUUID();
    const now = Date.now();
    const record: VaultRecord = {
      secretId, ciphertext, iv, burnAfterRead,
      createdAt: now, expiresAt: now + ttlSeconds * 1000,
    };
    vaults.set(secretId, record);
    return res.status(201).json({ secretId, expiresAt: record.expiresAt });
  }

  if (operation === "redeem") {
    const secretId = body.secretId;
    if (typeof secretId !== "string" || secretId.length > 100) {
      return res.status(400).json({ error: "A valid secretId is required.", code: "INVALID_SECRET_ID" });
    }

    const record = vaults.get(secretId);
    if (!record) {
      return res.status(410).json({
        error: "Secret expired, already redeemed, or unavailable.",
        code: "SECRET_UNAVAILABLE",
      });
    }
    if (record.expiresAt <= Date.now()) {
      vaults.delete(secretId);
      return res.status(410).json({ error: "Secret expired.", code: "SECRET_EXPIRED" });
    }

    if (record.burnAfterRead) vaults.delete(secretId);
    return res.status(200).json({
      ciphertext: record.ciphertext,
      iv: record.iv,
      burnAfterRead: record.burnAfterRead,
      burned: record.burnAfterRead,
      expiresAt: record.expiresAt,
    });
  }

  return res.status(404).json({ error: "Unknown API operation.", code: "UNKNOWN_OPERATION" });
}
