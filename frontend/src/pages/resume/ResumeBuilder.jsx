import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Upload, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, FileText, ZoomIn, ZoomOut, Sparkles, RotateCcw, Copy } from "lucide-react";
import ResumeDocument from "./ResumeDocument";
import { TEMPLATES, FONTS, fontCss, templateById } from "./resumeTemplates";
import { emptyResume, sampleResume, loadResume, saveResume, exportJson, importJson, atsScore, factories, SECTIONS } from "./resumeData";

// Standalone Resume Builder (route: /resume). Self-contained — its own shell,
// no app chrome. Data is a single JSON object autosaved to localStorage.
export default function ResumeBuilder() {
  const [resume, setResume] = useState(() => loadResume() || sampleResume());
  const [zoom, setZoom] = useState(0.75);
  const [savedAt, setSavedAt] = useState(null);
  const [tab, setTab] = useState("content"); // content | design | ats
  const fileRef = useRef(null);

  // Autosave (debounced) — offline draft in localStorage.
  useEffect(() => {
    const t = setTimeout(() => { if (saveResume(resume)) setSavedAt(Date.now()); }, 600);
    return () => clearTimeout(t);
  }, [resume]);

  const tpl = templateById(resume.theme?.templateId);
  const ats = useMemo(() => atsScore(resume), [resume]);

  // ---- update helpers ----------------------------------------------------
  const patch = (updater) => setResume((r) => { const n = structuredCloneSafe(r); updater(n); return n; });
  const setPersonal = (field, val) => patch((n) => { n.personal[field] = val; });
  const setTheme = (field, val) => patch((n) => { n.theme[field] = val; });
  const setField = (field, val) => patch((n) => { n[field] = val; });
  const addEntry = (section) => patch((n) => { n[section] = [...(n[section] || []), factories[section]()]; });
  const removeEntry = (section, id) => patch((n) => { n[section] = n[section].filter((e) => e.id !== id); });
  const setEntry = (section, id, field, val) => patch((n) => { n[section] = n[section].map((e) => (e.id === id ? { ...e, [field]: val } : e)); });
  const moveEntry = (section, id, dir) => patch((n) => {
    const arr = n[section]; const i = arr.findIndex((e) => e.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  });
  const setBullet = (section, id, idx, val) => patch((n) => { n[section] = n[section].map((e) => (e.id === id ? { ...e, bullets: e.bullets.map((b, k) => (k === idx ? val : b)) } : e)); });
  const addBullet = (section, id) => patch((n) => { n[section] = n[section].map((e) => (e.id === id ? { ...e, bullets: [...(e.bullets || []), ""] } : e)); });
  const removeBullet = (section, id, idx) => patch((n) => { n[section] = n[section].map((e) => (e.id === id ? { ...e, bullets: e.bullets.filter((_, k) => k !== idx) } : e)); });

  const toggleSection = (key) => patch((n) => { n.layout.hidden = { ...(n.layout.hidden || {}) }; n.layout.hidden[key] = !n.layout.hidden[key]; });
  const moveSection = (key, dir) => patch((n) => {
    const arr = n.layout.order.slice(); const i = arr.indexOf(key); const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; n.layout.order = arr;
  });

  const onPhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setPersonal("photo", String(reader.result || "")); reader.readAsDataURL(file);
  };
  const onImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { setResume(await importJson(file)); } catch (err) { alert(err.message); } finally { e.target.value = ""; }
  };
  const printPdf = () => window.print();

  // Config-driven editors for the repeatable sections (keeps this file lean).
  const ARRAY_UI = {
    experience: { title: "Work Experience", fields: [["role", "Role"], ["company", "Company"], ["location", "Location"], ["start", "Start (e.g. 2021)"], ["end", "End"]], current: true, bullets: true },
    education: { title: "Education", fields: [["degree", "Degree"], ["school", "School"], ["location", "Location"], ["start", "Start"], ["end", "End"], ["score", "Score / GPA"], ["details", "Details"]] },
    skills: { title: "Skills", fields: [["name", "Skill"], ["level", "Level (optional)"]] },
    projects: { title: "Projects", fields: [["name", "Name"], ["link", "Link"], ["description", "Description"]], bullets: true },
    certifications: { title: "Certifications", fields: [["name", "Name"], ["issuer", "Issuer"], ["date", "Date"], ["link", "Link"]] },
    languages: { title: "Languages", fields: [["name", "Language"], ["level", "Level"]] },
    references: { title: "References", fields: [["name", "Name"], ["relation", "Relation"], ["contact", "Contact"]] },
    interests: { title: "Interests", fields: [["name", "Interest"]] },
  };

  const ArrayEditor = ({ section }) => {
    const cfg = ARRAY_UI[section];
    const list = resume[section] || [];
    return (
      <div className="space-y-2">
        {list.map((entry, i) => (
          <div key={entry.id} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
            <div className="mb-1 flex items-center justify-end gap-1">
              <button type="button" onClick={() => moveEntry(section, entry.id, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => moveEntry(section, entry.id, 1)} disabled={i === list.length - 1} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => removeEntry(section, entry.id)} className="rounded p-1 text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cfg.fields.map(([f, label]) => <Field key={f} label={label} value={entry[f]} onChange={(v) => setEntry(section, entry.id, f, v)} />)}
            </div>
            {cfg.current && (
              <label className="mt-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={!!entry.current} onChange={(e) => setEntry(section, entry.id, "current", e.target.checked)} className="h-4 w-4 accent-brand-600" /> I currently work here
              </label>
            )}
            {cfg.bullets && (
              <div className="mt-2">
                <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Bullet points</span>
                {(entry.bullets || []).map((b, idx) => (
                  <div key={idx} className="mb-1 flex gap-1">
                    <input className="input !py-1 text-sm" value={b} onChange={(e) => setBullet(section, entry.id, idx, e.target.value)} placeholder="Started with an action verb; include a number." />
                    <button type="button" onClick={() => removeBullet(section, entry.id, idx)} className="rounded p-1 text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => addBullet(section, entry.id)} className="text-xs font-semibold text-brand-600 hover:underline">+ Add bullet</button>
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={() => addEntry(section)} className="btn-outline w-full text-sm"><Plus className="h-4 w-4" /> Add {cfg.title.replace(/s$/, "").toLowerCase()}</button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Print rules — only the A4 sheet prints, as selectable-text, A4 paged. */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #resume-print-area, #resume-print-area * { visibility: visible !important; }
        #resume-print-area { position: absolute; left: 0; top: 0; width: 100%; transform: none !important; }
        #resume-print-area .resume-sheet { box-shadow: none !important; margin: 0 !important; }
        @page { size: A4; margin: 0; }
        html, body { background: #fff !important; }
      }
      .resume-sheet, .resume-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`}</style>

      {/* Top toolbar */}
      <header className="no-print sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <span className="flex items-center gap-2 font-extrabold text-slate-800 dark:text-slate-100"><FileText className="h-5 w-5 text-brand-600" /> Resume Builder</span>
        <span className="text-xs text-slate-400">{savedAt ? "Saved" : "Autosaving…"}</span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))} className="btn-outline !p-2" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
          <span className="w-10 text-center text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="btn-outline !p-2" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={() => fileRef.current?.click()} className="btn-outline text-sm"><Upload className="h-4 w-4" /> Import</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
          <button onClick={() => exportJson(resume)} className="btn-outline text-sm"><Download className="h-4 w-4" /> JSON</button>
          <button onClick={() => { if (window.confirm("Start a blank resume? Your current draft stays exported only if you saved JSON.")) setResume(emptyResume()); }} className="btn-outline text-sm"><RotateCcw className="h-4 w-4" /> New</button>
          <button onClick={printPdf} className="btn-primary text-sm"><Download className="h-4 w-4" /> Download PDF</button>
        </div>
      </header>

      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Left: editor */}
        <div className="no-print space-y-3">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-sm dark:border-slate-700">
            {["content", "design", "ats"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1 font-semibold capitalize ${tab === t ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>{t === "ats" ? "ATS" : t}</button>
            ))}
          </div>

          {tab === "content" && (
            <div className="card space-y-4 p-4">
              {/* Personal */}
              <div>
                <h3 className="mb-2 font-bold">Personal Information</h3>
                <div className="mb-2 flex items-center gap-3">
                  {resume.personal.photo ? <img src={resume.personal.photo} alt="" className="h-14 w-14 rounded-full object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">Photo</div>}
                  <label className="btn-outline cursor-pointer text-sm"><Upload className="h-4 w-4" /> Upload photo<input type="file" accept="image/*" className="hidden" onChange={onPhoto} /></label>
                  {resume.personal.photo && <button onClick={() => setPersonal("photo", "")} className="text-xs text-rose-500 hover:underline">Remove</button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Full name" value={resume.personal.fullName} onChange={(v) => setPersonal("fullName", v)} />
                  <Field label="Professional title" value={resume.personal.title} onChange={(v) => setPersonal("title", v)} />
                  <Field label="Email" value={resume.personal.email} onChange={(v) => setPersonal("email", v)} />
                  <Field label="Phone" value={resume.personal.phone} onChange={(v) => setPersonal("phone", v)} />
                  <Field label="Location" value={resume.personal.location} onChange={(v) => setPersonal("location", v)} />
                  <Field label="Website" value={resume.personal.website} onChange={(v) => setPersonal("website", v)} />
                  <Field label="LinkedIn" value={resume.personal.linkedin} onChange={(v) => setPersonal("linkedin", v)} />
                  <Field label="GitHub" value={resume.personal.github} onChange={(v) => setPersonal("github", v)} />
                </div>
              </div>
              {/* Summary */}
              <div>
                <h3 className="mb-1 font-bold">Profile Summary</h3>
                <textarea rows={4} className="input resize-y text-sm" value={resume.summary} onChange={(e) => setField("summary", e.target.value)} placeholder="2\u20133 sentences: who you are, key strengths, and a standout achievement." />
              </div>
              {/* Repeatable sections */}
              {["experience", "education", "skills", "projects", "certifications", "languages", "references", "interests"].map((sec) => (
                <div key={sec}>
                  <h3 className="mb-2 font-bold">{ARRAY_UI[sec].title}</h3>
                  {ArrayEditor({ section: sec })}
                </div>
              ))}
            </div>
          )}

          {tab === "design" && (
            <div className="card space-y-4 p-4">
              <div>
                <h3 className="mb-2 font-bold">Template</h3>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => setTheme("templateId", t.id)} className={`rounded-lg border p-2 text-left text-sm ${resume.theme.templateId === t.id ? "border-brand-500 ring-2 ring-brand-300" : "border-slate-200 dark:border-slate-700"}`}>
                      <span className="inline-block h-3 w-3 rounded-full align-middle" style={{ background: t.style.accent }} /> <span className="align-middle">{t.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-400">More templates are just presets — easy to add.</p>
              </div>
              <label className="flex items-center justify-between text-sm font-semibold">Accent colour
                <input type="color" value={resume.theme.accent} onChange={(e) => setTheme("accent", e.target.value)} className="h-8 w-12 rounded border" />
              </label>
              <label className="block text-sm font-semibold">Font
                <select className="input mt-1" value={resume.theme.font} onChange={(e) => setTheme("font", e.target.value)}>
                  {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">Text size
                <input type="range" min="0.85" max="1.2" step="0.05" value={resume.theme.fontScale} onChange={(e) => setTheme("fontScale", parseFloat(e.target.value))} className="w-full accent-brand-600" />
              </label>
              <div>
                <h3 className="mb-2 font-bold">Sections</h3>
                <p className="mb-2 text-xs text-slate-400">Reorder and show/hide sections.</p>
                <div className="space-y-1">
                  {resume.layout.order.map((key, i) => {
                    const label = (SECTIONS.find((s) => s.key === key) || {}).label || key;
                    const hiddenNow = resume.layout.hidden?.[key];
                    return (
                      <div key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700">
                        <span className={`flex-1 ${hiddenNow ? "text-slate-400 line-through" : ""}`}>{label}</span>
                        <button onClick={() => moveSection(key, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveSection(key, 1)} disabled={i === resume.layout.order.length - 1} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button onClick={() => toggleSection(key)} className="rounded p-1 text-slate-500 hover:text-slate-800" title={hiddenNow ? "Show" : "Hide"}>{hiddenNow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "ats" && (
            <div className="card space-y-3 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: `conic-gradient(${ats.score >= 60 ? "#16a34a" : "#f59e0b"} ${ats.score * 3.6}deg, #e5e7eb 0)` }}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-extrabold dark:bg-slate-900">{ats.score}</span>
                </div>
                <div>
                  <p className="font-bold">ATS score: {ats.band}</p>
                  <p className="text-xs text-slate-500">Heuristic check of what recruiters &amp; parsers look for.</p>
                </div>
              </div>
              {ats.tips.length ? (
                <ul className="space-y-1 text-sm">
                  {ats.tips.map((t, i) => <li key={i} className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />{t}</li>)}
                </ul>
              ) : <p className="text-sm font-medium text-emerald-600">Looks great — no obvious gaps! \ud83c\udf89</p>}
              <p className="text-xs text-slate-400">AI keyword matching &amp; grammar checking are planned next.</p>
            </div>
          )}
        </div>

        {/* Right: live A4 preview */}
        <div className="overflow-auto">
          <div id="resume-print-area">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "210mm", margin: "0 auto" }}>
              <ResumeDocument resume={resume} style={tpl.style} accent={resume.theme.accent} fontFamily={fontCss(resume.theme.font)} fontScale={resume.theme.fontScale} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// structuredClone with a fallback for older browsers (keeps autosave safe).
function structuredCloneSafe(obj) {
  try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
}

// Module-scope input atom. MUST live outside the page component: if it were
// defined inside, it would get a new identity every render and React would
// remount the <input> on each keystroke, stealing focus after one character.
function Field({ label, value, onChange, type = "text", ...rest }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      <input type={type} className="input !py-1.5 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}
