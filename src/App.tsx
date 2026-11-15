import { useEffect, useState } from "react";
import { ArrowUpRight, Github, Shield, Terminal } from "lucide-react";
import VaultHeader from "./components/VaultHeader";
import EnvEncryptor from "./components/EnvEncryptor";
import SecretRedeemer from "./components/SecretRedeemer";
import AuditLedger from "./components/AuditLedger";

export default function App() {
  const [refresh, setRefresh] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [apiOnline, setApiOnline] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const secretId = params.get("secret");
  const keyFragment = new URLSearchParams(window.location.hash.slice(1)).get("key") || "";

  useEffect(() => {
    let mounted = true;
    fetch("/api/secrets")
      .then(async (response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then((data) => {
        if (!mounted) return;
        setApiOnline(true);
        setActiveCount(Number(data.count) || 0);
      })
      .catch(() => {
        if (!mounted) return;
        setApiOnline(false);
        setActiveCount(0);
      });
    return () => { mounted = false; };
  }, [refresh]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-7 md:px-8 md:py-10">
      <VaultHeader
        count={activeCount}
        apiOnline={apiOnline}
        onNew={() => document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" })}
      />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mono mb-2 text-[10px] tracking-[.22em] text-emerald-400">● SECURE TRANSMISSION WORKSPACE</div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Secrets shared.<br /><span className="text-slate-500">Never exposed.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Encrypt sensitive environment bundles in your browser, then share a one-time link with the people who need access.
          </p>
        </div>
        <div className="hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:block">
          <Shield size={25} className="text-emerald-400" />
          <div className="mono mt-3 text-[10px] text-slate-400">AES-256-GCM</div>
          <div className="mono text-[10px] text-slate-600">ZERO-KNOWLEDGE FLOW</div>
        </div>
      </div>
      {secretId ? (
        <div className="mx-auto max-w-3xl">
          <SecretRedeemer secretId={secretId} keyFragment={keyFragment} />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.35fr_.85fr]">
          <div id="composer">
            <EnvEncryptor onCreated={() => setRefresh((value) => value + 1)} />
          </div>
          <AuditLedger refreshKey={refresh} />
        </div>
      )}
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-[10px] text-slate-600">
        <div className="flex items-center gap-2"><Terminal size={13} /> VAULTPULSE // SECURE BY DESIGN</div>
        <a className="flex items-center gap-1 hover:text-slate-300" href="https://github.com/kennedy-blip/vaultpulse" target="_blank" rel="noreferrer">
          <Github size={12} /> SOURCE <ArrowUpRight size={10} />
        </a>
      </footer>
      <p className="mt-4 text-center text-[10px] leading-5 text-amber-500/70">
        Prototype storage is ephemeral server memory. Do not use for production secrets until a shared persistent store and atomic one-time redemption are configured.
      </p>
    </main>
  );
}
