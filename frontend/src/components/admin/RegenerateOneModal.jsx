import { useEffect, useRef, useState } from "react";
import { X, RefreshCw, Loader2, Server, KeyRound, StopCircle, AlertTriangle } from "lucide-react";
import { aiService } from "../../services";
import { useAuth } from "../../context/AuthContext";

/**
 * RegenerateOneModal — regenerate a SINGLE question's options / correct answer /
 * explanation to fit its stem, with an AI source + model chooser and a Stop
 * button (aborts the in-flight request). Self-contained: it runs the request
 * itself and hands the updated question back via onDone.
 *
 * Props:
 *  - open: boolean
 *  - question: the question object ({ _id, ... })
 *  - onClose()
 *  - onDone(updated)  — called with the regenerated fields on success
 */
export default function RegenerateOneModal({ open, question, onClose, onDone }) {
  const { user } = useAuth();
  const isClient = user?.role === "client" && user?.aiAccess;
  const canChooseSource = isClient && user?.aiAllowInbuilt !== false && user?.aiAllowSelf !== false;

  const [srcMode, setSrcMode] = useState(user?.aiMode === "self" ? "self" : "inbuilt");
  const [status, setStatus] = useState(null);
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const abortRef = useRef(null);

  useEffect(() => { if (open) { setMsg(""); setBusy(false); } }, [open]);

  useEffect(() => {
    if (!open) return;
    aiService
      .status(isClient ? srcMode : undefined)
      .then((s) => { setStatus(s); setModel(s?.model || (s?.models && s.models[0]) || ""); })
      .catch(() => setStatus({ enabled: false }));
  }, [open, srcMode, isClient]);

  if (!open) return null;

  const stop = () => { abortRef.current?.abort(); };

  const run = async () => {
    if (!question?._id) return;
    setBusy(true);
    setMsg("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const updated = await aiService.regenerate(
        { questionId: question._id, model: model || undefined, mode: isClient ? srcMode : undefined },
        { signal: controller.signal }
      );
      onDone?.(updated);
    } catch (e) {
      if (e?.aborted) setMsg("Stopped.");
      else setMsg(e.message || "Failed.");
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={busy ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md animate-scale-in card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold"><RefreshCw className="h-5 w-5 text-violet-600" /> Regenerate question</h3>
          <button onClick={onClose} disabled={busy}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          AI rebuilds this question's <b>options, correct answer and explanation</b> to fit its stem
          (reshuffles pair/matching columns). The question wording &amp; meaning stay the same.
        </p>

        {canChooseSource && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSrcMode("inbuilt")} disabled={busy}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${srcMode === "inbuilt" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300" : "border-slate-200 text-slate-600 hover:border-brand-400 dark:border-slate-700 dark:text-slate-300"}`}>
              <Server className="h-4 w-4" /> Built-in APIs
            </button>
            <button type="button" onClick={() => setSrcMode("self")} disabled={busy}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${srcMode === "self" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300" : "border-slate-200 text-slate-600 hover:border-brand-400 dark:border-slate-700 dark:text-slate-300"}`}>
              <KeyRound className="h-4 w-4" /> My own APIs
            </button>
          </div>
        )}

        {status && !status.enabled ? (
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> AI is not available</p>
            <p className="mt-1">{isClient ? "Add an API key in the AI tab, or ask your administrator." : "Add an API key in Admin → AI Keys to enable this."}</p>
          </div>
        ) : (
          <>
            {status?.models && status.models.length > 1 && (
              <div className="mb-3">
                <label className="mb-1 block text-sm font-semibold">AI model</label>
                <select className="input" value={model} onChange={(e) => setModel(e.target.value)} disabled={busy}>
                  {status.models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            <div className="mt-2 flex justify-end gap-2">
              {busy ? (
                <button type="button" onClick={stop} className="btn-outline text-rose-600">
                  <StopCircle className="h-4 w-4" /> Stop
                </button>
              ) : (
                <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
              )}
              <button type="button" onClick={run} disabled={busy} className="btn-primary">
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Regenerating…</> : <><RefreshCw className="h-4 w-4" /> Regenerate</>}
              </button>
            </div>
          </>
        )}

        {msg && <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{msg}</p>}
      </div>
    </div>
  );
}
