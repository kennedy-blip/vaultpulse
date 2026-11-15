import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Flame, Unlock } from "lucide-react";
import { decryptSecret } from "../lib/crypto";
import { apiRequest } from "../lib/api";

type RedeemResponse = { ciphertext: string; iv: string; burned: boolean };

export default function SecretRedeemer({ secretId, keyFragment }: { secretId: string; keyFragment: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Retrieving encrypted payload...");
  const [payload, setPayload] = useState("");
  const [burned, setBurned] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (!keyFragment) throw new Error("Missing key fragment. Open the complete share link.");
        const data = await apiRequest<RedeemResponse>("/api?op=redeem", {
          method: "POST",
          body: JSON.stringify({ secretId }),
        });
        const clear = await decryptSecret(data.ciphertext, data.iv, keyFragment);
        if (live) { setPayload(clear); setBurned(Boolean(data.burned)); setState("ready"); }
      } catch (error) {
        if (live) {
          setMessage(error instanceof Error ? error.message : "Unable to unlock this secret.");
          setState("error");
        }
      }
    })();
    return () => { live = false; };
  }, [secretId, keyFragment]);

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Unlock size={16} className="text-violet-400" /> Secret recipient terminal</div>
      {state === "loading" && <p className="mono text-xs text-cyan-300">{message}</p>}
      {state === "error" && <div role="alert" className="flex gap-2 text-sm text-rose-300"><AlertTriangle />{message}</div>}
      {state === "ready" && <>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"><Flame size={15} />{burned ? "Burn requested — record deleted on retrieval." : "Secret retrieved."}</div>
        <pre className="mono max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-xs leading-6 text-emerald-300">{payload}</pre>
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 size={14} /> Decrypted locally with AES-GCM-256</div>
      </>}
      <div className="mono mt-5 border-t border-slate-800 pt-3 text-[10px] text-slate-600">HTTP /api?op=redeem · {secretId.slice(0, 12)}…</div>
    </section>
  );
}
