export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new Error("Cannot reach the VaultPulse API. Check the deployment and try again.");
  }

  const raw = await response.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const hint = raw.replace(/\s+/g, " ").slice(0, 160);
    throw new Error(
      `The API returned a non-JSON response (HTTP ${response.status}). ${hint || "Check Vercel Function logs."}`,
    );
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `API request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  return data as T;
}
