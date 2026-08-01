import { useState } from "react";
import { SearchCheck, Upload, Loader2, Trash2, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { contentService } from "../../services";
import MathText from "../../components/ui/MathText";
import QuestionView from "../../components/admin/QuestionView";

// Standalone "Question Checker": paste questions (bulk or single) or upload a
// file/image, and see — for each question — whether it already exists in YOUR
// question bank (exact copy, near-duplicate, or a related/reworded question),
// and where it lives. Backend is owner-scoped, so an admin searches platform
// content and a client their own.
//
// Statuses returned by the backend per question:
//   exact   → an identical question is already in your bank
//   strong  → a very similar question exists (near-duplicate)
//   related → a related question exists (same topic/terms, maybe reworded /
//             different options)
//   none    → not found in your bank (looks original)
const STATUS = {
  exact:   { label: "Already in your bank",  cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  strong:  { label: "Very similar exists",   cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  related: { label: "Related question exists",cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  none:    { label: "Not found (original)",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

export default function AdminChecker() {
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);   // reading an uploaded file
  const [checking, setChecking] = useState(false); // running the match
  const [msg, setMsg] = useState("");
  const [report, setReport] = useState(null);      // { total, found, summary, results }
  const [expanded, setExpanded] = useState(() => new Set()); // which result rows are open
  const toggle = (i) => setExpanded((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  // Read an uploaded file into the text box. PDFs use pdf.js (OCR fallback for
  // scans); images use OCR; Word/PPT/Excel/CSV/text use lib/docs.
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/.test(name);
    setReading(true);
    setReport(null);
    setMsg(`Reading “${file.name}”…`);
    try {
      let extracted = "";
      if (isPdf) {
        const { extractPdfText, looksScanned, ocrPdfText } = await import("../../lib/pdf");
        extracted = await extractPdfText(file, (page, t) => setMsg(`Reading “${file.name}” — page ${page}/${t}…`));
        if (!extracted || looksScanned(extracted)) {
          setMsg(`“${file.name}” looks scanned — running OCR (downloads the OCR engine on first use, please wait)…`);
          extracted = await ocrPdfText(file, (page, t) => setMsg(`OCR “${file.name}” — page ${page}/${t}…`));
        }
      } else if (isImage) {
        const { ocrImage } = await import("../../lib/pdf");
        setMsg(`Running OCR on “${file.name}” (downloads the OCR engine on first use, please wait)…`);
        extracted = await ocrImage(file);
      } else {
        const { extractDocText } = await import("../../lib/docs");
        extracted = await extractDocText(file);
      }
      extracted = (extracted || "").trim();
      if (!extracted) { setMsg(`Couldn't read any text from “${file.name}”.`); return; }
      setText((prev) => (prev.trim() ? `${prev.trim()}\n\n${extracted}` : extracted));
      setMsg(`✓ Read “${file.name}” (${extracted.length.toLocaleString()} characters). Now click “Check my bank”.`);
    } catch (err) {
      setMsg(`Couldn't read “${file.name}”: ${err.message}`);
    } finally {
      setReading(false);
    }
  };

  const run = async () => {
    if (!text.trim()) { setMsg("Paste some questions, or upload a file/image first."); return; }
    setChecking(true);
    setReport(null);
    setMsg("Checking your question bank…");
    try {
      const r = await contentService.checkQuestions({ content: text });
      setExpanded(new Set());
      setReport(r);
      setMsg("");
    } catch (e) {
      setMsg(e.message || "Couldn't check the questions.");
    } finally {
      setChecking(false);
    }
  };

  const busy = reading || checking;

  return (
    <div className="container-page space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><SearchCheck className="h-6 w-6 text-brand-600" /> Question Checker</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Paste questions (one or many, any format) or upload a file/image to see which of them already
          exist in your question bank — as an exact copy, a very similar question, or a related/reworded
          one — and where each match lives. Nothing is saved; this only searches your own content.
        </p>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-semibold">Paste your questions</label>
          <div className="flex items-center gap-2">
            {text.trim() && (
              <button type="button" onClick={() => { setText(""); setReport(null); setMsg(""); }} disabled={busy} className="btn-outline !py-1 !text-xs text-rose-600">
                <Trash2 className="h-3.5 w-3.5" /> Clear text
              </button>
            )}
            <label className={`btn-outline !py-1 !text-xs ${busy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}>
              <Upload className="h-3.5 w-3.5" /> Upload file / image
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.json,.rtf,image/*" className="hidden" onChange={onFile} disabled={busy} />
            </label>
          </div>
        </div>
        <textarea
          rows={10}
          className="input resize-y font-mono text-xs"
          placeholder={"Paste one or many questions here, e.g.\n\n1. Which anatomical plane divides the body into left and right halves?\n2. The powerhouse of the cell is:\n\n…or upload a PDF / Word / image (PNG/JPG) of a question paper."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
        />
        <button type="button" onClick={run} disabled={busy || !text.trim()} className="btn-primary">
          {checking ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</>
            : reading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading file…</>
            : <><SearchCheck className="h-4 w-4" /> Check my bank</>}
        </button>
        {msg && (
          <p className="inline-flex items-center gap-1 text-sm font-medium">
            {msg.startsWith("✓") && <CheckCircle2 className="h-4 w-4 text-emerald-600" />} {msg}
          </p>
        )}
      </div>

      {report && (
        <div className="card p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">
              {report.found} of {report.total} question(s) match your bank
            </span>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{report.summary.exact} exact</span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{report.summary.strong} very similar</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{report.summary.related} related</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{report.summary.none} not found</span>
          </div>

          <div className="space-y-3">
            {report.results.map((r, i) => {
              const s = STATUS[r.status] || STATUS.none;
              const open = expanded.has(i);
              return (
                <div key={i} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  {/* Tap the row to expand and compare both questions. */}
                  <button type="button" onClick={() => toggle(i)} className="flex w-full items-start justify-between gap-2 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex flex-1 items-start gap-2">
                      {open ? <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />}
                      <div className="flex-1 text-sm font-medium">
                        <span className="mr-1 text-slate-400">Q{i + 1}.</span> <MathText>{r.question}</MathText>
                        <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                          {r.match
                            ? <>Matched in <b className="font-semibold">{r.match.location}</b>{r.status !== "exact" ? ` · ${r.similarity}% word overlap` : ""} — tap to compare both</>
                            : "Tap to view your question"}
                        </span>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                  </button>
                  {open && (
                    <div className="grid gap-3 border-t border-slate-100 p-3 dark:border-slate-800 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Your question</p>
                        <div className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/60"><MathText>{r.yourQuestion || r.question}</MathText></div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          In your bank{r.match ? <span className="font-normal normal-case"> · {r.match.location}</span> : ""}
                        </p>
                        {r.match
                          ? <QuestionView q={r.match} />
                          : <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">No matching question found in your bank — looks original.</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Matching compares each question's wording (ignoring the options), so reworded questions with
            different options are still caught as "related". Very heavily reworded questions using different
            words may still read as "not found" — always eyeball the closest match.
          </p>
        </div>
      )}
    </div>
  );
}
