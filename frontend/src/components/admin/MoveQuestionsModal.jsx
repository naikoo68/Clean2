import { useEffect, useState } from "react";
import { X, ArrowRightLeft, Loader2 } from "lucide-react";
import { practiceService } from "../../services";

// Move selected questions from a source quiz into ANY other quiz the admin
// owns — pick the destination by drilling Stream → Subject → Topic → Quiz
// (My-Quiz hierarchy), not just siblings in the same topic.
//
// Props:
//  - open, onClose
//  - sourceId:    the quiz the questions currently live in (excluded as a target)
//  - questionIds: ids to move
//  - onMoved(res): called after a successful move (res = server response)
export default function MoveQuestionsModal({ open, onClose, sourceId, questionIds = [], onMoved }) {
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState({ stream: "", subject: "", topic: "", item: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setSel({ stream: "", subject: "", topic: "", item: "" });
    setSubjects([]); setTopics([]); setItems([]); setMsg("");
    practiceService.adminStreams("quiz").then(setStreams).catch(() => setStreams([]));
  }, [open]);

  if (!open) return null;

  const count = questionIds.length;
  const targetItems = items.filter((it) => it._id !== sourceId);

  const Select = ({ value, onChange, placeholder, options }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input py-2 text-sm">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o._id} value={o._id}>{o.name || o.title}</option>)}
    </select>
  );

  const doMove = async () => {
    if (!sel.item || busy || !count) return;
    setBusy(true); setMsg("");
    try {
      const res = await practiceService.moveQuestions(sourceId, questionIds, sel.item);
      onMoved?.(res);
    } catch (e) {
      setMsg(e.message || "Move failed.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={busy ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} className="my-10 w-full max-w-lg animate-scale-in card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <ArrowRightLeft className="h-5 w-5 text-brand-600" /> Move {count} question{count === 1 ? "" : "s"}
          </h3>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Choose any destination quiz — pick its Stream, Subject, Topic and Quiz.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Select
            value={sel.stream}
            placeholder="Stream…"
            options={streams}
            onChange={(v) => {
              setSel({ stream: v, subject: "", topic: "", item: "" });
              setSubjects([]); setTopics([]); setItems([]);
              if (v) practiceService.adminSubjects(v).then(setSubjects).catch(() => setSubjects([]));
            }}
          />
          <Select
            value={sel.subject}
            placeholder="Subject…"
            options={subjects}
            onChange={(v) => {
              setSel((s) => ({ ...s, subject: v, topic: "", item: "" }));
              setTopics([]); setItems([]);
              if (v) practiceService.adminTopics(v).then(setTopics).catch(() => setTopics([]));
            }}
          />
          <Select
            value={sel.topic}
            placeholder="Topic…"
            options={topics}
            onChange={(v) => {
              setSel((s) => ({ ...s, topic: v, item: "" }));
              setItems([]);
              if (v) practiceService.adminTopicItems(v).then(setItems).catch(() => setItems([]));
            }}
          />
          <select value={sel.item} onChange={(e) => setSel((s) => ({ ...s, item: e.target.value }))} className="input py-2 text-sm">
            <option value="">Quiz…</option>
            {targetItems.map((it) => <option key={it._id} value={it._id}>{it.name} ({it.questionCount ?? 0})</option>)}
          </select>
        </div>
        {sel.topic && targetItems.length === 0 && (
          <p className="mt-2 text-xs text-slate-400">No other quiz in this topic — pick another topic, or create a quiz there first.</p>
        )}
        {msg && <p className="mt-3 text-sm font-medium text-rose-600">{msg}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="button" onClick={doMove} disabled={!sel.item || busy || !count} className="btn-primary disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Moving…</> : <><ArrowRightLeft className="h-4 w-4" /> Move here</>}
          </button>
        </div>
      </div>
    </div>
  );
}
