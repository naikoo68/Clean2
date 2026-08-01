import { useEffect, useState } from "react";
import { X, Wand2, Loader2 } from "lucide-react";

/**
 * ExtendOneQuestionModal — in-app popup (replaces the native window.confirm)
 * asking whether AI should also fix off-category / wrong options and/or extend
 * the question length while it extends a SINGLE question's explanation.
 *
 * Props:
 *  - open: boolean
 *  - busy: boolean          — true while the extend request is running
 *  - onCancel()             — close without doing anything
 *  - onConfirm({ fixOptions, extendQuestion, shuffleOptions })  — run the extend; checkbox values
 */
export default function ExtendOneQuestionModal({ open, busy, onCancel, onConfirm }) {
  const [fixOptions, setFixOptions] = useState(false);
  const [extendQuestion, setExtendQuestion] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);

  useEffect(() => { if (open) { setFixOptions(false); setExtendQuestion(false); setShuffleOptions(false); } }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={busy ? undefined : onCancel}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md animate-scale-in card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Wand2 className="h-5 w-5 text-brand-600" /> Extend explanation
          </h3>
          <button onClick={onCancel} disabled={busy}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          AI will rewrite this question's explanation and per-option notes to be detailed and complete.
        </p>

        <label className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={fixOptions}
            onChange={(e) => setFixOptions(e.target.checked)}
            disabled={busy}
          />
          <span>
            Also fix <b>off-category / wrong options</b> — replace any option that isn't the same type as
            the answer (e.g. a bird among tree names) with a closely-related one. The question &amp; correct
            answer stay the same.
          </span>
        </label>

        <label className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={extendQuestion}
            onChange={(e) => setExtendQuestion(e.target.checked)}
            disabled={busy}
          />
          <span>
            Also <b>extend the question length</b> — rewrite the short stem into a longer, clearer, more
            descriptive question. The <b>meaning</b>, options and correct answer stay the same.
          </span>
        </label>

        <label className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={shuffleOptions}
            onChange={(e) => setShuffleOptions(e.target.checked)}
            disabled={busy}
          />
          <span>
            Also <b>reshuffle the options</b> — move the answer to a new position so it isn't always in the
            same place. The <b>same</b> option stays correct (assertion questions are left as-is).
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-outline">Cancel</button>
          <button type="button" onClick={() => onConfirm({ fixOptions, extendQuestion, shuffleOptions })} disabled={busy} className="btn-primary">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Extending…</> : <><Wand2 className="h-4 w-4" /> Extend</>}
          </button>
        </div>
      </div>
    </div>
  );
}
