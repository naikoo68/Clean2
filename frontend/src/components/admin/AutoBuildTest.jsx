import { useEffect, useMemo, useState } from "react";
import { X, Wand2, Loader2, CheckCircle2, Search } from "lucide-react";
import { contentService, practiceService, testService } from "../../services";
import { QUESTION_TYPE_LABELS } from "../../lib/questions";

// Auto-build a test with EXACT per-type counts.
//   1. Pick which of the test's PREDEFINED subjects to fill (from its plan).
//   2. Tick ONE OR MORE QUIZ SUBJECTS to pull from (e.g. General Science ←
//      Biology + Physics + Chemistry). No new subjects are created.
//   3. For EACH QUESTION TYPE, type exactly how many you want — split by
//      difficulty columns (Easy / Medium / Hard / Any). You get precisely that
//      many of each type. Counts are spread across the ticked source subjects,
//      and everything is filed under the chosen predefined subject.
//
// `plan`     = the test's subjectPlan [{ subject:<name>, count }].
// `practice` = build a "My Test" from the caller's own My Practice quizzes.
const DIFF_COLS = [
  { key: "Easy", label: "Easy" },
  { key: "Medium", label: "Med" },
  { key: "Hard", label: "Hard" },
  { key: "", label: "Any" },
];
const TYPE_KEYS = Object.keys(QUESTION_TYPE_LABELS);

export default function AutoBuildTest({ open, onClose, testId, testName = "", plan = [], practice = false, onDone }) {
  const [libSubjects, setLibSubjects] = useState([]);
  const [section, setSection] = useState("");
  const [sourceIds, setSourceIds] = useState([]);
  const [cells, setCells] = useState({}); // `${typeKey}|${diffKey}` -> count
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSection(""); setSourceIds([]); setCells({}); setSearch(""); setMsg(""); setReport(null);
    setLoading(true);
    const load = practice
      ? practiceService.allSubjects().then((s) => (s || []).filter((x) => (x.kind ? x.kind === "quiz" : true)))
      : contentService.subjects();
    load.then(setLibSubjects).catch(() => setLibSubjects([])).finally(() => setLoading(false));
  }, [open, practice]);

  const libByName = useMemo(() => {
    const m = {};
    for (const s of libSubjects) m[String(s.name || "").trim().toLowerCase()] = s;
    return m;
  }, [libSubjects]);

  const targetOptions = useMemo(() => {
    if (Array.isArray(plan) && plan.length) {
      return plan.map((p) => String(p.subject || "").trim()).filter(Boolean)
        .map((name) => ({ name, planned: (plan.find((p) => (p.subject || "") === name) || {}).count || 0 }));
    }
    return libSubjects.map((s) => ({ name: s.name, planned: 0 }));
  }, [plan, libSubjects]);

  const onPickSection = (name) => {
    setSection(name); setCells({});
    const match = libByName[name.trim().toLowerCase()];
    setSourceIds(match ? [String(match._id)] : []);
  };
  const toggleSource = (id) => setSourceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const chosenSubjects = useMemo(
    () => sourceIds.map((id) => libSubjects.find((s) => String(s._id) === id)).filter(Boolean),
    [sourceIds, libSubjects]
  );

  const cellKey = (typeKey, diffKey) => `${typeKey}|${diffKey}`;
  const setCell = (typeKey, diffKey, v) => setCells((m) => ({ ...m, [cellKey(typeKey, diffKey)]: v }));
  const rowTotal = (typeKey) => DIFF_COLS.reduce((s, c) => s + (parseInt(cells[cellKey(typeKey, c.key)], 10) || 0), 0);
  const total = useMemo(() => Object.values(cells).reduce((s, n) => s + (parseInt(n, 10) || 0), 0), [cells]);

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? libSubjects.filter((s) => String(s.name || "").toLowerCase().includes(q)) : libSubjects;
  }, [libSubjects, search]);

  if (!open) return null;

  const srcKey = (id) => (practice ? { practiceSubject: id } : { subject: id });

  // For each TYPE × difficulty cell you set, pull EXACTLY that many — spread
  // evenly across the ticked source subjects so you never over/under-pull.
  const buildBlueprint = () => {
    const out = [];
    for (const k of TYPE_KEYS) {
      for (const c of DIFF_COLS) {
        const count = parseInt(cells[cellKey(k, c.key)], 10) || 0;
        if (count <= 0 || !sourceIds.length) continue;
        const per = Math.floor(count / sourceIds.length);
        let rem = count % sourceIds.length;
        for (const id of sourceIds) {
          const cnt = per + (rem-- > 0 ? 1 : 0);
          if (cnt > 0) out.push({ ...srcKey(id), section, type: k, difficulty: c.key || undefined, count: cnt });
        }
      }
    }
    return out;
  };

  const submit = async () => {
    if (!section) { setMsg("Choose which subject to fill."); return; }
    if (!sourceIds.length) { setMsg("Tick at least one quiz subject to pull from."); return; }
    const blueprint = buildBlueprint();
    if (!blueprint.length) { setMsg("Type how many questions you want for at least one type."); return; }
    setBusy(true); setMsg(""); setReport(null);
    try {
      const res = await testService.autoBuild(testId, blueprint);
      const n = res?.inserted ?? 0;
      setReport(res?.report || []);
      setMsg(n ? `\u2713 Added ${n} question(s) to "${section}".` : "No matching questions were found — try higher counts, 'Any' difficulty, or more source subjects.");
      if (n) { onDone?.(n); setCells({}); }
    } catch (e) {
      setMsg(e.message || "Couldn't build the test.");
    } finally {
      setBusy(false);
    }
  };

  const noSubjects = !loading && targetOptions.length === 0;
  const noSources = !loading && libSubjects.length === 0;

  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg animate-scale-in card p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Wand2 className="h-5 w-5 text-brand-600" /> Auto-build{testName ? ` \u2014 ${testName}` : ""}
          </h3>
          <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Choose which of this test's <b>subjects</b> to fill, tick <b>one or more quiz subjects</b> to pull from, then type <b>exactly how many questions per question type</b> (split by difficulty). You get precisely those counts. Nothing new is created.
        </p>

        {loading ? (
          <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" /></div>
        ) : noSubjects ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700">
            This test has no subjects defined yet. Add its subjects (subject plan) first.
          </p>
        ) : noSources ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700">
            No quizzes with questions found to pull from yet. Build some quizzes first.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold">Fill this subject {Array.isArray(plan) && plan.length ? "(from the test's plan)" : ""}</label>
              <select value={section} onChange={(e) => onPickSection(e.target.value)} className="input py-2 text-sm">
                <option value="">Choose a subject…</option>
                {targetOptions.map((o) => (<option key={o.name} value={o.name}>{o.name}{o.planned ? ` (plan: ${o.planned})` : ""}</option>))}
              </select>
            </div>

            {section && (
              <div>
                <label className="mb-1 block text-sm font-semibold">Pull questions from <span className="font-normal text-slate-400">(tick one or more)</span></label>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-slate-700">
                    <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quiz subjects…" className="w-full bg-transparent text-sm outline-none" />
                    <span className="flex-shrink-0 text-xs text-slate-400">{sourceIds.length} selected</span>
                  </div>
                  <div className="max-h-32 space-y-0.5 overflow-y-auto p-2">
                    {filteredSubjects.map((s) => (
                      <label key={s._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <input type="checkbox" checked={sourceIds.includes(String(s._id))} onChange={() => toggleSource(String(s._id))} className="h-4 w-4 accent-brand-600" />
                        <span className="truncate text-slate-700 dark:text-slate-200">{s.name}</span>
                      </label>
                    ))}
                    {filteredSubjects.length === 0 && <p className="py-2 text-center text-xs text-slate-400">No subjects match "{search}".</p>}
                  </div>
                </div>
              </div>
            )}

            {/* PER-TYPE COUNT GRID — the exact number you want of each type */}
            {section && sourceIds.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-semibold">How many of each question type</label>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800/60">
                    <span className="min-w-0 flex-1">Question type</span>
                    {DIFF_COLS.map((c) => <span key={c.key} className="w-12 flex-shrink-0 text-center">{c.label}</span>)}
                    <span className="w-10 flex-shrink-0 text-center">Total</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {TYPE_KEYS.map((k) => (
                      <div key={k} className="flex items-center gap-1 px-2 py-1">
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-200">{QUESTION_TYPE_LABELS[k]}</span>
                        {DIFF_COLS.map((c) => (
                          <input
                            key={c.key}
                            type="number" min="0"
                            value={cells[cellKey(k, c.key)] || ""}
                            onChange={(e) => setCell(k, c.key, e.target.value)}
                            placeholder="0"
                            className="w-12 flex-shrink-0 rounded-md border border-slate-200 bg-white py-1 text-center text-xs outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
                          />
                        ))}
                        <span className="w-10 flex-shrink-0 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{rowTotal(k) || ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">You'll get exactly these counts per type. Each is spread across the {chosenSubjects.length} ticked subject(s). Leave the difficulty columns and use <b>Any</b> if you don't need a difficulty split.</p>
                {total > 0 && <p className="text-xs text-slate-400">Total to add to {section}: <b>{total}</b> question(s).</p>}
              </div>
            )}
          </div>
        )}

        {report && report.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700">
            <p className="mb-2 font-semibold text-slate-500 dark:text-slate-400">Result</p>
            <div className="space-y-1">
              {report.map((r, i) => {
                const label = [r.type ? (QUESTION_TYPE_LABELS[r.type] || r.type) : null, r.difficulty || "Any"].filter(Boolean).join(" · ");
                const short = r.got < r.requested;
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-600 dark:text-slate-300">{label}</span>
                    <span className={`flex-shrink-0 font-semibold ${short ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {r.got}/{r.requested}{short ? " (fewer in bank)" : ""}
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
          <button type="button" onClick={submit} disabled={busy || loading || noSubjects || !section || !sourceIds.length || total <= 0} className="btn-primary">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Building…</> : <><Wand2 className="h-4 w-4" /> Build ({total})</>}
          </button>
        </div>
      </div>
    </div>
  );
}
