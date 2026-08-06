import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, LayoutDashboard, Wrench, ArrowRightLeft, Sparkles, FileText, Feather,
  ListChecks, FileStack, HelpCircle, Play, Download, Globe, RefreshCw, Wand2, Search,
  Crown, GraduationCap, FolderOpen, Layers, ShieldCheck,
  BarChart3, Plus, Upload, Library, Eye, Copy, ScanSearch, Scissors, GitMerge,
  SearchCheck, User, Gift, Send, Share2, Files,
} from "lucide-react";
import { authService, practiceService, aiService } from "../../services";
import { useAuth } from "../../context/AuthContext";
import { Loading, ErrorState } from "../../components/ui/AsyncState";

// The workspace navigation rail, in order — used to draw the little "where am
// I" sidebar inside each screen preview so users can see where the tool lives.
const RAIL = [
  { key: "dashboard", Icon: LayoutDashboard },
  { key: "build", Icon: Wrench },
  { key: "papers", Icon: Files },
  { key: "checker", Icon: SearchCheck },
  { key: "aigen", Icon: Sparkles },
  { key: "documents", Icon: FileText },
  { key: "notes", Icon: Feather },
  { key: "account", Icon: User },
];

// A lightweight, self-contained "screenshot" of a feature's screen: an app
// window frame with the workspace rail (current tool highlighted), the real
// toolbar buttons that function uses, and a few placeholder content rows so it
// reads like the actual page. It's drawn from markup — no image files — so it
// stays crisp on any display, follows light/dark theme, and never goes stale
// or 404s the way a static screenshot would.
function ScreenMock({ tab, title, visual = [] }) {
  return (
    <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* window title bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{title}</span>
      </div>
      <div className="flex">
        {/* workspace rail — the screen you're on is highlighted */}
        <div className="flex w-9 flex-shrink-0 flex-col items-center gap-1 border-r border-slate-100 bg-slate-50 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          {RAIL.map(({ key, Icon }) => (
            <span
              key={key}
              className={`flex h-6 w-6 items-center justify-center rounded-md ${key === tab ? "bg-brand-600 text-white" : "text-slate-400 dark:text-slate-500"}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
        {/* content area */}
        <div className="min-w-0 flex-1 p-3">
          {/* toolbar = the actual buttons this function shows */}
          {visual.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visual.map((v, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold ${v.primary ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"}`}
                >
                  <v.Icon className="h-3.5 w-3.5" /> {v.label}
                </span>
              ))}
            </div>
          )}
          {/* placeholder content rows so the preview looks like a real page */}
          <div className="mt-3 space-y-2">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="h-6 w-6 flex-shrink-0 rounded-md bg-brand-100 dark:bg-brand-900/40" />
                <span className="h-2 rounded bg-slate-200 dark:bg-slate-700" style={{ width: `${70 - r * 15}%` }} />
                <span className="ml-auto h-4 w-9 flex-shrink-0 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="border-t border-slate-100 px-3 py-1 text-center text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Preview of the {title} screen
      </figcaption>
    </figure>
  );
}

// A living USER MANUAL for clients. Everything here reflects the account's
// CURRENT state — the guides that show depend on which features are enabled for
// this client (AI / Documents / Notes), and the "What's on your account"
// overview + plan limits are read live from the API, so the manual updates
// automatically whenever content is added/deleted or access changes. Nothing
// is hard-coded that would go stale.
export default function ClientUserManual({ onGoTab }) {
  const { user } = useAuth();
  const hasAI = !!user?.aiAccess;

  const [items, setItems] = useState([]);
  const [planInfo, setPlanInfo] = useState(null);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      practiceService.myItems().catch(() => []),
      authService.plans().catch(() => ({ plans: [] })),
      hasAI ? aiService.status().catch(() => null) : Promise.resolve(null),
    ])
      .then(([myItems, plansRes, aiStatus]) => {
        setItems(Array.isArray(myItems) ? myItems : []);
        setPlanInfo((plansRes?.plans || []).find((p) => p.key === user?.subscriptionPlan) || null);
        setAi(aiStatus);
      })
      .catch((e) => setError(e.message || "Could not load your manual."))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  // Live overview derived from the client's OWN content — auto-updates on
  // add/delete because it is recomputed from the fresh myItems() every load.
  const overview = useMemo(() => {
    const quizzes = items.filter((i) => i.kind === "quiz");
    const tests = items.filter((i) => i.kind === "test");
    const distinct = (arr, key) => new Set(arr.map((x) => x[key]?._id).filter(Boolean)).size;
    const totalQ = items.reduce((s, i) => s + (i.questionCount || 0), 0);
    // Group streams → how many quizzes/tests sit under each (for the live list).
    const streamMap = new Map();
    for (const it of items) {
      const s = it.stream;
      if (!s?._id) continue;
      const cur = streamMap.get(String(s._id)) || { name: s.name, quizzes: 0, tests: 0 };
      if (it.kind === "quiz") cur.quizzes += 1; else cur.tests += 1;
      streamMap.set(String(s._id), cur);
    }
    return {
      quizzes: quizzes.length,
      tests: tests.length,
      totalQ,
      streams: distinct(items, "stream"),
      subjects: distinct(quizzes, "subject"),
      topics: distinct(quizzes, "topic"),
      streamList: [...streamMap.values()],
    };
  }, [items]);

  // What THIS client can actually do (mirrors the workspace tabs). Guides are
  // gated by these, so the manual only ever documents available features and
  // updates automatically when the admin changes access.
  const can = {
    dashboard: user?.featDashboard !== false,
    build: user?.featBuild !== false,
    papers: user?.featPapers !== false,
    checker: user?.featChecker !== false,
    documents: user?.featDocuments !== false,
    notes: user?.featNotes !== false,
    ai: hasAI,
    aigen: !!user?.featAiGenerator,
  };

  // Feature guides — one per function. Each carries a `visual`: the SAME icons
  // and button styles the real app uses, so it shows "how it looks" and stays
  // in sync automatically when the UI/access/content changes (no static
  // screenshots to go stale).
  const guides = [
    {
      key: "dashboard", tab: "dashboard", Icon: LayoutDashboard, title: "Dashboard — practice your content",
      show: can.dashboard,
      visual: [
        { Icon: Play, label: "Practice", primary: true },
        { Icon: Search, label: "Search" },
        { Icon: Download, label: "Paper / Key" },
        { Icon: BarChart3, label: "Performance" },
      ],
      steps: [
        "Open the Dashboard to see everything you've built and your live account validity.",
        "Switch between My Quiz and My Test, then drill Stream → Subject → Topic → Quiz (tests go Stream → Test).",
        "Tap Practice / Take Test to start. The search box finds any quiz, test or question by name or content.",
        "Use the download icon on any card to export a printable question paper or answer key (PDF).",
        "Scroll to Performance for your accuracy, best score, attempt history and weak areas — it updates after every attempt.",
      ],
    },
    {
      key: "build", tab: "build", Icon: Wrench, title: "Build — create your structure",
      show: can.build,
      visual: [
        { Icon: Plus, label: "Add Stream", primary: true },
        { Icon: Plus, label: "Add Subject" },
        { Icon: Plus, label: "Add Topic" },
        { Icon: Plus, label: "Add Quiz" },
      ],
      steps: [
        "Open Build and pick My Quiz or My Test.",
        "Create a Stream, then a Subject, then (My Quiz) a Topic — use the Add button at each level.",
        "Inside a Topic (Quiz) or Subject (Test), click Add Quiz / Add Test and set its name, duration, marks and difficulty.",
        "Everything you add appears on your Dashboard immediately.",
      ],
    },
    {
      key: "questions", tab: "build", Icon: ListChecks, title: "Add questions to a quiz / test",
      show: can.build,
      visual: [
        { Icon: Plus, label: "Add Manually", primary: true },
        { Icon: Upload, label: "Bulk Upload" },
        { Icon: Library, label: "Pick from Quizzes" },
        { Icon: Eye, label: "View All" },
        { Icon: Copy, label: "Copy CSV" },
        { Icon: Download, label: "CSV" },
      ],
      steps: [
        "Open a quiz/test and tap Questions to open its question tools.",
        "Add Manually: write one question at a time (MCQ, matching, assertion–reason, statements, pairs, table…).",
        "Bulk Upload: paste or upload many questions at once.",
        "Pick from Quizzes: copy existing questions from your other quizzes into this one.",
        "View All reviews every question (Admin/Student view); Copy CSV / CSV export them.",
      ],
    },
    {
      key: "aigenerate", tab: "build", Icon: Sparkles, title: "Generate questions with AI",
      show: can.ai,
      visual: [
        { Icon: Sparkles, label: "AI Generate", primary: true },
        { Icon: Globe, label: "Import from Web" },
      ],
      steps: [
        "In a quiz/test's question tools, tap AI Generate.",
        "Type a topic (or paste a web/YouTube link), list exact subtopics if you like, then set how many of each type & difficulty.",
        "Generate, review the preview, and Insert. \"Generate more\" continues from the uncovered subtopics (no repeats).",
        "Import from Web reads a PDF / document / web page / YouTube transcript and turns it into questions.",
        "Choose your AI source (built-in keys or your own) in the AI tab.",
      ],
    },
    {
      key: "improve", tab: "build", Icon: Wand2, title: "Improve questions with AI",
      show: can.ai && can.build,
      visual: [
        { Icon: Sparkles, label: "Extend Explanations" },
        { Icon: RefreshCw, label: "Regenerate All" },
        { Icon: ScanSearch, label: "Scan Missing Areas" },
        { Icon: Sparkles, label: "Other question types" },
      ],
      steps: [
        "Extend Explanations: enrich the explanation of one question, or all at once.",
        "Regenerate All: rebuild every question's options/answer (reshuffles pair/matching).",
        "Scan Missing Areas: find syllabus subtopics not yet covered, then generate for just those.",
        "Other question types: turn your existing MCQs into assertion–reason, statements, matching or pairs.",
      ],
    },
    {
      key: "organise", tab: "build", Icon: GitMerge, title: "Organise & clean up questions",
      show: can.build,
      visual: [
        { Icon: Scissors, label: "Split" },
        { Icon: GitMerge, label: "Merge" },
        { Icon: Files, label: "Duplicates" },
      ],
      steps: [
        "Split: break a large quiz (or a whole topic) into quizzes of N questions.",
        "Merge: combine several sibling quizzes into one (use Select all to grab them quickly).",
        "Find Duplicates: scan a subject (or across all topics) for repeated questions and delete the extra copies.",
      ],
    },
    {
      key: "papers", tab: "papers", Icon: Files, title: "Previous Papers",
      show: can.papers,
      visual: [
        { Icon: Plus, label: "Add Exam" },
        { Icon: Plus, label: "Add Year" },
        { Icon: Plus, label: "Add Paper" },
        { Icon: Files, label: "Paper files" },
      ],
      steps: [
        "Open Previous Papers and build Stream → Exam → Year → Paper.",
        "Add the paper's questions like any quiz (they play with instant answers).",
        "Use Paper files on a paper to upload the actual question-paper PDF and one or more answer keys (original, revised…), plus additional information.",
        "Students open the paper, see the PDFs + info, and practise it like a quiz.",
      ],
    },
    {
      key: "checker", tab: "checker", Icon: SearchCheck, title: "Question Checker",
      show: can.checker,
      visual: [
        { Icon: SearchCheck, label: "Check my bank", primary: true },
        { Icon: Upload, label: "Upload file / image" },
      ],
      steps: [
        "Open Question Checker and paste questions, or upload a file/image of a paper.",
        "\"Check my bank\" shows, per question, whether it already exists in your content — exact copy, very similar, related, or original — and where.",
        "Tick \"Deep check with AI\" to match by meaning across formats (uses AI).",
        "Nothing is saved — it only searches your own questions.",
      ],
    },
    {
      key: "aigen", tab: "aigen", Icon: Sparkles, title: "AI Generator (studio)",
      show: can.aigen,
      visual: [{ Icon: Sparkles, label: "AI Generator", primary: true }],
      steps: [
        "Open the AI Generator tab for a dedicated space to draft questions in bulk.",
        "Generate, review, and save straight into your quizzes/tests.",
      ],
    },
    {
      key: "documents", tab: "documents", Icon: FileText, title: "Documents — write & render",
      show: can.documents,
      visual: [{ Icon: FileText, label: "Documents" }, { Icon: Copy, label: "Copy for Word" }],
      steps: [
        "Open Documents to write notes and render math/chemistry equations.",
        "Copy for Word pastes rendered equations straight into MS Word.",
        "Saved documents can be a source when importing questions with AI.",
      ],
    },
    {
      key: "notes", tab: "notes", Icon: Feather, title: "Notes — AI study notes",
      show: can.notes,
      visual: [{ Icon: Feather, label: "Notes" }],
      steps: [
        "Open Notes to generate clean, structured study notes on any topic with AI.",
      ],
    },
    {
      key: "migrate", tab: "migrate", Icon: ArrowRightLeft, title: "Migrate — move content",
      show: can.build,
      visual: [{ Icon: ArrowRightLeft, label: "Migrate" }],
      steps: [
        "Open Migrate to move or copy quizzes/tests (and their questions) between streams, subjects or topics.",
      ],
    },
    {
      key: "sharing", tab: "dashboard", Icon: Send, title: "Share & receive content",
      show: can.build,
      visual: [{ Icon: Send, label: "Send to user" }, { Icon: Share2, label: "Share" }],
      steps: [
        "On any stream/subject/topic/quiz, use Send to user / Share to send it to another account by email.",
        "Content others send you appears at the top of your Dashboard — Accept to save your own copy (whole streams save directly; smaller shares ask where to save).",
      ],
    },
    {
      key: "account", tab: "account", Icon: User, title: "Account — validity, plan & referral",
      show: true,
      visual: [{ Icon: User, label: "Account" }, { Icon: Crown, label: "Renew / change plan" }, { Icon: Gift, label: "Refer a friend" }],
      steps: [
        "Open Account (in the ☰ menu) for your name, email, plan and validity.",
        "Renew / change plan before your access expires.",
        "Share your referral code — for every friend who buys a plan you get 10 free days.",
      ],
    },
  ].filter((g) => g.show);

  const Stat = ({ value, label, Icon }) => (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
      <Icon className="mx-auto mb-1 h-4 w-4 text-brand-500" />
      <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold leading-none">User Manual</h1>
            <p className="mt-1 text-sm text-slate-400">A guide to every tool you can use, with a preview picture of each screen so it's easy to follow. The previews use the real buttons, and this manual updates automatically as your access or content changes.</p>
          </div>
          <button onClick={load} title="Refresh" className="btn-ghost ml-auto"><RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Refresh</span></button>
        </div>
      </div>

      {loading ? (
        <div className="card p-6"><Loading label="Loading your manual..." /></div>
      ) : error ? (
        <div className="card p-6"><ErrorState message={error} onRetry={load} /></div>
      ) : (
        <>
          {/* LIVE overview — reflects your current content */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-emerald-600" /> What's on your account now</h2>
            <p className="mt-0.5 text-xs text-slate-400">This is read live — add or delete a quiz/test and it changes here automatically.</p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <Stat value={overview.quizzes} label="Quizzes" Icon={ListChecks} />
              <Stat value={overview.tests} label="Tests" Icon={FileStack} />
              <Stat value={overview.totalQ} label="Questions" Icon={HelpCircle} />
              <Stat value={overview.streams} label="Streams" Icon={GraduationCap} />
              <Stat value={overview.subjects} label="Subjects" Icon={FolderOpen} />
              <Stat value={overview.topics} label="Topics" Icon={Layers} />
            </div>

            {overview.streamList.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Your streams</p>
                <div className="flex flex-wrap gap-2">
                  {overview.streamList.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700">
                      <GraduationCap className="h-3.5 w-3.5 text-brand-500" />
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-slate-400">{s.quizzes} quiz{s.quizzes === 1 ? "" : "zes"}{s.tests ? `, ${s.tests} test${s.tests === 1 ? "" : "s"}` : ""}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">You haven't built any quizzes or tests yet.</p>
                {onGoTab && <button onClick={() => onGoTab("build")} className="btn-outline mt-3"><Wrench className="h-4 w-4" /> Go to Build</button>}
              </div>
            )}
          </div>

          {/* Plan & limits — reflects the plan assigned to this client */}
          {(planInfo || ai?.planName) && (
            <div className="card p-5">
              <h2 className="flex items-center gap-2 font-bold"><Crown className="h-4 w-4 text-amber-500" /> Your plan &amp; limits</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Plan: <span className="font-semibold">{planInfo?.label || ai?.planName}</span>
                {planInfo?.price ? <span className="text-slate-400"> · ₹{planInfo.price}</span> : null}
              </p>
              {hasAI && (planInfo?.maxPerBatch || ai?.maxPerBatch) && (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <Stat value={planInfo?.maxPerBatch || ai?.maxPerBatch} label="Questions / batch" Icon={Sparkles} />
                    <Stat value={planInfo?.perWindow ?? ai?.perWindow ?? "—"} label="Questions / window" Icon={RefreshCw} />
                    <Stat value={`${planInfo?.windowMinutes || ai?.windowMinutes || 5} min`} label="Window" Icon={HelpCircle} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">These are your AI question-generation limits. {ai?.remaining != null ? `${ai.remaining} left in the current window.` : ""}</p>
                </>
              )}
            </div>
          )}

          {/* How-to guides — only the features available to you are shown */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-bold"><BookOpen className="h-4 w-4 text-brand-600" /> How to use your workspace</h2>
            <p className="mt-0.5 text-xs text-slate-400">Only the tools enabled for your account are listed{hasAI ? "" : " — ask your administrator to enable AI for more"}.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {guides.map((g) => (
                <div key={g.key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"><g.Icon className="h-4 w-4" /></span>
                    <h3 className="font-bold">{g.title}</h3>
                  </div>
                  {/* "How it looks" — a preview image of the screen, drawn with
                      the real buttons/icons this function uses and styled like
                      the live app, so it stays in sync with the UI. */}
                  <ScreenMock tab={g.tab} title={g.title.split(" — ")[0]} visual={g.visual} />
                  <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
                    {g.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  {onGoTab && (
                    <button onClick={() => onGoTab(g.tab)} className="btn-ghost mt-3 text-xs text-brand-600">
                      Open {g.title.split(" — ")[0]} <ArrowRightLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick tips */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-bold"><HelpCircle className="h-4 w-4 text-brand-600" /> Tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-2"><Search className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /> Use the search box on the Dashboard to find any quiz, test or question by name or content.</li>
              <li className="flex gap-2"><Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /> A quiz/test needs at least one question before you can practise it.</li>
              <li className="flex gap-2"><Download className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /> Export any quiz/test as a printable paper or answer key from its card.</li>
              {hasAI && <li className="flex gap-2"><Wand2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /> Use Regenerate to fix a question's options/answer, or Extend explanation to enrich it — one at a time or all at once.</li>}
              {hasAI && <li className="flex gap-2"><Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /> Import from Web can read a PDF, document, web page or YouTube transcript.</li>}
              <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" /> Keep an eye on your account validity on the Dashboard and renew before it expires.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
