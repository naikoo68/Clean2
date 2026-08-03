import { useState } from "react";
import { X, Share2, Send, CheckCircle2, Loader2 } from "lucide-react";
import { practiceService } from "../../services";

// Share practice content with ANOTHER REGISTERED user by email. Works for a
// whole stream, a subject, a topic, or a single quiz/test — the caller passes
// the level + id. The recipient must already have an account; if not, the
// backend replies that the user has no account and nothing is shared.
//
// Props:
//  - target: { level: "stream"|"subject"|"topic"|"item", id, name }
//  - onClose()
const LABEL = { stream: "stream", subject: "subject", topic: "topic", item: "quiz / test" };

export default function ShareByEmailModal({ target, onClose }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { recipient, shared, emailed }

  const share = async () => {
    const to = email.trim();
    if (!to) { setError("Enter the recipient's email."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await practiceService.share({ level: target.level, id: target.id, email: to });
      setDone(res);
    } catch (e) {
      // The backend returns a clear "no account" message when the email isn't registered.
      setError(e.message || "Couldn't share. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/50 p-4" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="my-16 w-full max-w-md animate-scale-in card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Share2 className="h-5 w-5 text-brand-600" /> Share by email</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Sharing {LABEL[target.level] || "content"}: <b className="text-slate-700 dark:text-slate-200">{target.name}</b>
        </p>

        {done ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            <CheckCircle2 className="mr-1 inline h-4 w-4" />
            Shared {done.shared} item{done.shared === 1 ? "" : "s"} with <b>{done.recipient?.name || done.recipient?.email}</b>.
            {done.emailed ? " They've been emailed a link." : " (Email notification is off, but it's now in their dashboard.)"}
            <div className="mt-3 text-right">
              <button onClick={onClose} className="btn-outline py-1.5 text-xs">Done</button>
            </div>
          </div>
        ) : (
          <>
            <label className="mb-1.5 block text-sm font-medium">Recipient's account email</label>
            <input
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="input"
              placeholder="person@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && share()}
              disabled={busy}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              The person must already have an account. They'll see it in their dashboard with the same Stream › Subject › Topic layout, and can practise it — they can't edit it.
            </p>
            {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} disabled={busy} className="btn-outline">Cancel</button>
              <button onClick={share} disabled={busy || !email.trim()} className="btn-primary">
                {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Sharing…</> : <><Send className="h-4 w-4" /> Share</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
