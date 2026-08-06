import { useMemo, useState } from "react";
import {
  BookOpen, Search, ArrowRightLeft, ChevronRight,
  LayoutDashboard, Wrench, Files, SearchCheck, Sparkles, FileText, Feather, User, Send,
} from "lucide-react";

/* =============================================================================
   USER MANUAL — CONTENT
   =============================================================================
   This is a STANDALONE, content-driven manual. Everything shown on the page is
   generated from the MANUAL array below — there is no live data fetching, so you
   have full manual control over every function, sub-function and image.

   HOW TO ADD OR EDIT AN ENTRY
   ---------------------------------------------------------------------------
   1. IMAGE  → drop a screenshot into   frontend/public/manual/<name>.png
              then set   image: "<name>.png"   on the entry.
   2. DETAILS→ write the explanation as lines in   details: ["line 1", "line 2"]
   3. SUB-FUNCTIONS → nest them inside   children: [ { ... }, { ... } ]
              You can nest as deep as you like (function → sub-function → …).
   4. OPTIONAL "OPEN" BUTTON → set   tab: "build"  (a workspace tab key) to show
              a button that jumps the user to that tab.
   5. OPTIONAL ICON → set   Icon: SomeLucideIcon   (import it at the top).

   Every field except `title` is optional. To add a brand-new function, copy any
   block below, change the text, and (optionally) add an image. That's it.
   ========================================================================== */
const MANUAL = [
  {
    id: "dashboard",
    title: "Dashboard",
    Icon: LayoutDashboard,
    tab: "dashboard",
    image: "dashboard.png",
    summary: "Practice everything you've built and track your progress.",
    details: [
      "Open the Dashboard to see all your quizzes and tests, plus your live account validity.",
      "Switch between My Quiz and My Test, then drill Stream → Subject → Topic → Quiz (tests go Stream → Test).",
    ],
    children: [
      {
        title: "Practice / Take Test",
        details: ["Tap Practice on a quiz, or Take Test on a test, to start. A quiz/test needs at least one question before you can practise it."],
      },
      {
        title: "Search",
        details: ["Use the search box to find any quiz, test or question by its name or content."],
      },
      {
        title: "Download paper / answer key",
        details: ["Use the download icon on any card to export a printable question paper or an answer key (PDF)."],
      },
      {
        title: "Performance",
        details: ["Scroll to Performance for your accuracy, best score, attempt history and weak areas — it updates after every attempt."],
      },
    ],
  },

  {
    id: "build",
    title: "Build",
    Icon: Wrench,
    tab: "build",
    image: "build.png",
    summary: "Create your own structure, then fill it with questions.",
    details: [
      "Open Build and pick My Quiz or My Test.",
      "Everything you add here appears on your Dashboard immediately.",
    ],
    children: [
      {
        title: "Create the structure",
        details: ["Build the hierarchy from the top down. Use the Add button at each level."],
        children: [
          { title: "Add Stream", details: ["The top level (e.g. an exam or class). Create this first."] },
          { title: "Add Subject", details: ["Sits under a Stream."] },
          { title: "Add Topic", details: ["Sits under a Subject (My Quiz only)."] },
          { title: "Add Quiz / Add Test", details: ["Inside a Topic (Quiz) or Subject (Test), set its name, duration, marks and difficulty."] },
        ],
      },
      {
        title: "Add questions to a quiz / test",
        details: ["Open a quiz/test and tap Questions to open its question tools."],
        children: [
          { title: "Add Manually", details: ["Write one question at a time — MCQ, matching, assertion–reason, statements, pairs, table, and more."] },
          { title: "Bulk Upload", details: ["Paste or upload many questions at once."] },
          { title: "Pick from Quizzes", details: ["Copy existing questions from your other quizzes into this one."] },
          { title: "View All", details: ["Review every question in Admin or Student view."] },
          { title: "Copy CSV / Export CSV", details: ["Copy the questions as CSV, or download them as a CSV file."] },
        ],
      },
      {
        title: "Generate questions with AI",
        image: "aigen.png",
        details: [
          "In a quiz/test's question tools, tap AI Generate.",
          "Type a topic (or paste a web/YouTube link), optionally list exact subtopics, then set how many of each type and difficulty.",
          "Generate, review the preview, and Insert. \"Generate more\" continues from the uncovered subtopics (no repeats).",
        ],
        children: [
          { title: "Import from Web", details: ["Reads a PDF, document, web page or YouTube transcript and turns it into questions."] },
          { title: "Choose your AI source", details: ["Pick built-in keys or your own in the AI tab."] },
        ],
      },
      {
        title: "Improve questions with AI",
        details: ["Polish questions you already have."],
        children: [
          { title: "Extend Explanations", details: ["Enrich the explanation of one question, or all at once."] },
          { title: "Regenerate All", details: ["Rebuild every question's options/answer (reshuffles pair/matching)."] },
          { title: "Scan Missing Areas", details: ["Find syllabus subtopics not yet covered, then generate for just those."] },
          { title: "Other question types", details: ["Turn your existing MCQs into assertion–reason, statements, matching or pairs."] },
        ],
      },
      {
        title: "Organise & clean up questions",
        details: ["Keep large banks tidy."],
        children: [
          { title: "Split", details: ["Break a large quiz (or a whole topic) into quizzes of N questions."] },
          { title: "Merge", details: ["Combine several sibling quizzes into one (use Select all to grab them quickly)."] },
          { title: "Find Duplicates", details: ["Scan a subject (or across all topics) for repeated questions and delete the extra copies."] },
        ],
      },
    ],
  },

  {
    id: "papers",
    title: "Previous Papers",
    Icon: Files,
    tab: "papers",
    image: "papers.png",
    summary: "Organise real exam papers and let students practise them.",
    details: [
      "Open Previous Papers and build Stream → Exam → Year → Paper.",
      "Add the paper's questions like any quiz (they play with instant answers).",
    ],
    children: [
      { title: "Paper files", details: ["Upload the actual question-paper PDF and one or more answer keys (original, revised…), plus any additional information."] },
      { title: "Student view", details: ["Students open the paper, see the PDFs + info, and practise it like a quiz."] },
    ],
  },

  {
    id: "checker",
    title: "Question Checker",
    Icon: SearchCheck,
    tab: "checker",
    image: "checker.png",
    summary: "Check whether questions already exist in your content.",
    details: [
      "Open Question Checker and paste questions, or upload a file/image of a paper.",
      "Nothing is saved — it only searches your own questions.",
    ],
    children: [
      { title: "Check my bank", details: ["Shows, per question, whether it already exists — exact copy, very similar, related, or original — and where."] },
      { title: "Deep check with AI", details: ["Tick this to match by meaning across formats (uses AI)."] },
    ],
  },

  {
    id: "aigen",
    title: "AI Generator (studio)",
    Icon: Sparkles,
    tab: "aigen",
    image: "aigen.png",
    summary: "A dedicated space to draft questions in bulk.",
    details: [
      "Open the AI Generator tab to draft questions in bulk.",
      "Generate, review, and save straight into your quizzes/tests.",
    ],
  },

  {
    id: "documents",
    title: "Documents",
    Icon: FileText,
    tab: "documents",
    image: "documents.png",
    summary: "Write notes and render math / chemistry equations.",
    details: [
      "Open Documents to write notes and render math/chemistry equations.",
      "Saved documents can be a source when importing questions with AI.",
    ],
    children: [
      { title: "Copy for Word", details: ["Pastes rendered equations straight into MS Word."] },
    ],
  },

  {
    id: "notes",
    title: "Notes",
    Icon: Feather,
    tab: "notes",
    image: "notes.png",
    summary: "Generate clean, structured study notes with AI.",
    details: ["Open Notes to generate clean, structured study notes on any topic with AI."],
  },

  {
    id: "migrate",
    title: "Migrate",
    Icon: ArrowRightLeft,
    tab: "migrate",
    image: "migrate.png",
    summary: "Move or copy content between locations.",
    details: ["Open Migrate to move or copy quizzes/tests (and their questions) between streams, subjects or topics."],
  },

  {
    id: "sharing",
    title: "Share & receive content",
    Icon: Send,
    tab: "dashboard",
    image: "dashboard.png",
    summary: "Send your content to others and accept what they send you.",
    details: [
      "On any stream/subject/topic/quiz, use Send to user / Share to send it to another account by email.",
      "Content others send you appears at the top of your Dashboard — Accept to save your own copy (whole streams save directly; smaller shares ask where to save).",
    ],
  },

  {
    id: "account",
    title: "Account",
    Icon: User,
    tab: "account",
    image: "account.png",
    summary: "Your validity, plan and referral code.",
    details: [
      "Open Account (in the ☰ menu) for your name, email, plan and validity.",
      "Renew / change plan before your access expires.",
      "Share your referral code — for every friend who buys a plan you get 10 free days.",
    ],
  },
];

/* ---------------------------------------------------------------------------
   RENDERING — you normally don't need to touch anything below this line.
   ------------------------------------------------------------------------ */

// Returns true if an entry (or any of its descendants) matches the search text.
function matches(entry, q) {
  if (!q) return true;
  const hay = [entry.title, entry.summary, ...(entry.details || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (hay.includes(q)) return true;
  return (entry.children || []).some((c) => matches(c, q));
}

// One manual entry, rendered recursively so functions → sub-functions → … all
// use the same layout (image + details + nested children), just indented more.
function Entry({ entry, depth, onGoTab }) {
  const isTop = depth === 0;
  const HeadingTag = isTop ? "h2" : "h3";

  return (
    <section
      className={
        isTop
          ? "card p-5"
          : "mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
      }
    >
      <div className="flex items-center gap-2">
        {entry.Icon ? (
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <entry.Icon className="h-4 w-4" />
          </span>
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-brand-500" />
        )}
        <HeadingTag className={isTop ? "text-lg font-extrabold" : "font-bold"}>
          {entry.title}
        </HeadingTag>
        {entry.tab && onGoTab && (
          <button
            onClick={() => onGoTab(entry.tab)}
            className="btn-ghost ml-auto text-xs text-brand-600"
          >
            Open <ArrowRightLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {entry.summary && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{entry.summary}</p>
      )}

      {/* A real screenshot of the screen, added manually via `image`. */}
      {entry.image && (
        <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <img
            src={`/manual/${entry.image}`}
            alt={`Screenshot of ${entry.title}`}
            loading="lazy"
            className="block w-full"
          />
        </figure>
      )}

      {entry.details?.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
          {entry.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ol>
      )}

      {/* Sub-functions — rendered with the exact same component, one level in. */}
      {entry.children?.length > 0 && (
        <div className={isTop ? "mt-4" : "mt-3"}>
          {entry.children.map((child, i) => (
            <Entry key={child.id || i} entry={child} depth={depth + 1} onGoTab={onGoTab} />
          ))}
        </div>
      )}
    </section>
  );
}

// A living USER MANUAL for clients — a standalone, content-driven page. Every
// function, sub-function and image comes from the MANUAL array above, so it can
// be edited by hand without touching any data-fetching code.
export default function ClientUserManual({ onGoTab }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const sections = useMemo(
    () => MANUAL.filter((e) => matches(e, query)),
    [query]
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
            <p className="mt-1 text-sm text-slate-400">
              A step-by-step guide to every tool, with a screenshot of each screen.
            </p>
          </div>
        </div>

        {/* Search across every function and sub-function. */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the manual…"
            className="input pl-9"
          />
        </div>
      </div>

      {/* The manual itself */}
      {sections.length > 0 ? (
        sections.map((entry) => (
          <Entry key={entry.id} entry={entry} depth={0} onGoTab={onGoTab} />
        ))
      ) : (
        <div className="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Nothing matches “{q}”. Try a different search.
        </div>
      )}
    </div>
  );
}
