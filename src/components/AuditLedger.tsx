import { useEffect, useState } from "react";
import { Clock3, RefreshCw } from "lucide-react";

type Vault = {
  secretId: string;
  burnAfterRead: boolean;
  createdAt: number;
  expiresAt: number;
};

export default function AuditLedger({ refreshKey }: { refreshKey: number }) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [status, setStatus] = useState("connecting");
  const [now, setNow] = useState(Date.now());

  async function load() {
    try {
      const response = await fetch("/api/secrets", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      setVaults(Array.isArray(data.vaults) ? data.vaults : []);
      setStatus("online");
    } catch {
      setStatus("offline");
      setVaults([]);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [refreshKey]);

  return (
    <section className="panel p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Vault audit ledger</div>
          <p className="mt-1 text-xs text-slate-500">Metadata only · ciphertext never listed</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void load()} aria-label="Refresh vault ledger"><RefreshCw size={13} /></button>
      </div>
      <div className="mb-4 flex justify-between rounded-lg bg-slate-950/70 px-3 py-2 text-xs">
        <span className="mono text-slate-500">BACKEND STATUS</span>
        <span className={status === "online" ? "text-emerald-400" : "text-amber-400"}>● {status.toUpperCase()}</span>
      </div>
      {vaults.length === 0 ? (
        <div className="py-8 text-center">
          <Clock3 className="mx-auto mb-3 text-slate-600" />
          <p className="text-xs text-slate-400">{status === "online" ? "No active secret drops yet." : "Start Vercel dev to connect the API."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vaults.map((vault) => (
            <div key={vault.secretId} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="min-w-0">
                <div className="mono truncate text-xs">{vault.secretId.slice(0, 18)}…</div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {vault.burnAfterRead ? "BURN AFTER READ" : "STANDARD TTL"} · {Math.max(0, Math.ceil((vault.expiresAt - now) / 1000))}s left
                </div>
              </div>
              <span className="rounded bg-cyan-500/10 px-2 py-1 text-[9px] text-cyan-300">ACTIVE</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
