import { useEffect, useState } from "react";
import { X, Wand2, Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { contentService, testService } from "../../services";
import { QUESTION_TYPE_LABELS } from "../../lib/questions";

// Auto-build a test from a BLUEPRINT: each row says "N questions from Subject
// (optionally a Topic), of a given Type and Difficulty" and the backend
// automatically PICKS matching questions from the existing quiz bank and copies
// them into the test. Difficulty/type/topic are optional per row ("Any").
const DIFFS = ["Easy", "Medium", "Hard"];
const TYPE_KEYS = Object.keys(QUESTION_TYPE_LABELS);

const emptyRow = () => ({ subject: "", topic: "", type: "", difficulty: "", count: 10 });

export default function AutoBuildTest({ open, onClose, testId, testName = "", onDone }) {
  const [subjects, setSubjects] = useState([]);
  const [topicsBySubject, setTopicsBySubject] = useState({}); // subjectId -> [topics]
  const [rows, setRows] = useState([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [report, setReport] = useState(null); // per-row result after a run

  useEffect(() => {
    if (!open) return;
    setRows([emptyRow()]);
    setMsg("");
    setReport(null);
    setLoading(true);
    contentService.subjects().then(setSubjects).catch(() => setSubjects([])).finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  // Lazy-load a subject's topics the first time it's selected.
  const ensureTopics = (subjectId) => {
    if (!subjectId || topicsBySubject[subjectId]) return;
    contentService.topics(subjectId)
      .then((t) => setTopicsBySubject((m) => ({ ...m, [subjectId]: t || [] })))
      .catch(() => setTopicsBySubject((m) => ({ ...m, [subjectId]: [] })));
  };

  const setRow = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (i) => setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const totalRequested = rows.reduce((s, r) => s + (r.subject ? Math.max(0, parseInt(r.count, 10) || 0) : 0), 0);

  const submit = async () => {
    const blueprint = [];
    for (const r of rows) {
      const count = parseInt(r.count, 10) || 0;
      if (!r.subject || count <= 0) continue;
      const subj = subjects.find((s) => String(s._id) === String(r.subject));
      blueprint.push({
        subject: r.subject,
        section: subj?.name || "",
        topic: r.topic || undefined,
        type: r.type || undefined,
        difficulty: r.difficulty || undefined,
        count,
      });
    }
    if (!blueprint.length) { setMsg("Add at least one row with a subject and a count."); return; }
    setBusy(true); setMsg(""); setReport(null);
    try {
      const res = await testService.autoBuild(testId, blueprint);
      const n = res?.inserted ?? 0;
      setReport(res?.report || []);
      setMsg(n ? `\u2713 Added ${n} question(s) to the test.` : "No matching questions were found for your blueprint.");
      if (n) onDone?.(n);
    } catch (e) {
      setMsg(e.message || "Couldn't build the test.");
    } finally {
      setBusy(false);
    }
  };

  const noSubjects = !loading && subjects.length === 0;

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-3xl animate-scale-in card p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Wand2 className="h-5 w-5 text-brand-600" /> Auto-build test{testName ? ` \u2014 ${testName}` : ""}
          </h3>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Add rows describing how many questions to pull, from which <b>subject</b> (and optional <b>topic</b>), of a chosen <b>type</b> and <b>difficulty</b>. We automatically pick matching questions from your existing quizzes and add them to the test. Leave Topic / Type / Difficulty on <b>Any</b> to not restrict them.
        </p>

        {loading ? (
          <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" /></div>
        ) : noSubjects ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700">
            No quiz subjects with questions found yet. Build some quizzes first, then come back.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="hidden grid-cols-[1.4fr_1.4fr_1fr_0.9fr_0.6fr_auto] gap-2 px-1 text-xs font-semibold text-slate-400 sm:grid">
              <span>Subject</span><span>Topic</span><span>Type</span><span>Difficulty</span><span>Count</span><span></span>
            </div>
            {rows.map((r, i) => {
              const topics = topicsBySubject[r.subject] || [];
              return (
                <div key={i} className="grid grid-cols-2 items-center gap-2 rounded-lg border border-slate-100 p-2 dark:border-slate-800 sm:grid-cols-[1.4fr_1.4fr_1fr_0.9fr_0.6fr_auto] sm:border-0 sm:p-0">
                  <select
                    value={r.subject}
                    onChange={(e) => { const v = e.target.value; setRow(i, { subject: v, topic: "" }); ensureTopics(v); }}
                    className="input py-1.5 text-sm"
                  >
                    <option value="">Choose subject…</option>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>

                  <select
                    value={r.topic}
                    onChange={(e) => setRow(i, { topic: e.target.value })}
                    disabled={!r.subject}
                    className="input py-1.5 text-sm disabled:opacity-50"
                  >
                    <option value="">Any topic</option>
                    {topics.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                  </select>

                  <select value={r.type} onChange={(e) => setRow(i, { type: e.target.value })} className="input py-1.5 text-sm">
                    <option value="">Any type</option>
                    {TYPE_KEYS.map((k) => <option key={k} value={k}>{QUESTION_TYPE_LABELS[k]}</option>)}
                  </select>

                  <select value={r.difficulty} onChange={(e) => setRow(i, { difficulty: e.target.value })} className="input py-1.5 text-sm">
                    <option value="">Any level</option>
                    {DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <input
                    type="number" min="1" value={r.count}
                    onChange={(e) => setRow(i, { count: e.target.value })}
                    className="input py-1.5 text-sm" title="How many questions"
                  />

                  <button type="button" onClick={() => removeRow(i)} className="flex-shrink-0 justify-self-end rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" title="Remove row">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addRow} className="btn-outline w-full py-1.5 text-sm">
              <Plus className="h-4 w-4" /> Add row
            </button>
            {totalRequested > 0 && <p className="text-xs text-slate-400">Blueprint total: up to <b>{totalRequested}</b> question(s).</p>}
          </div>
        )}

        {/* Per-row result after a run — shows requested vs actually found */}
        {report && report.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700">
            <p className="mb-2 font-semibold text-slate-500 dark:text-slate-400">Result</p>
            <div className="space-y-1">
              {report.map((r, i) => {
                const parts = [r.subject, r.type ? (QUESTION_TYPE_LABELS[r.type] || r.type) : null, r.difficulty || null].filter(Boolean).join(" · ");
                const short = r.got < r.requested;
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-600 dark:text-slate-300">{parts}{r.topic ? " · (topic)" : ""}</span>
                    <span className={`flex-shrink-0 font-semibold ${short ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {r.got}/{r.requested}{short ? " (bank had fewer)" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {msg && (
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
            {msg.startsWith("\u2713") && <CheckCircle2 className="h-4 w-4 text-emerald-600" />} {msg}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline">Close</button>
          <button type="button" onClick={submit} disabled={busy || loading || noSubjects} className="btn-primary">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Building…</> : <><Wand2 className="h-4 w-4" /> Build test</>}
          </button>
        </div>
      </div>
    </div>
  );
}
