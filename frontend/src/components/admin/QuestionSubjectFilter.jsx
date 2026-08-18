// QuestionSubjectFilter — a filter bar for a TEST's "View all" question list.
//
// Test questions carry a `section` field = the subject they belong to (matches a
// name in the test's subjectPlan). This shows one chip per subject actually
// present, WITH its question count, plus an "All" chip — so an admin can see at a
// glance how many questions each subject has in the test, and filter to just one.
//
// Renders nothing when there are fewer than 2 subjects (nothing to break down).
//
// Props:
//  - questions: the full (unfiltered) question list
//  - selected:  the selected subject ("" = all)
//  - onChange(nextSubject)

const UNASSIGNED = "\u2014 No subject \u2014"; // shown for questions with no section

export function questionSubject(q) {
  const s = String(q?.section || "").trim();
  return s || UNASSIGNED;
}

// Group a question list into { subject: count }, preserving first-seen order.
export function subjectCounts(questions = []) {
  const counts = {};
  for (const q of questions) {
    const k = questionSubject(q);
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

export default function QuestionSubjectFilter({ questions = [], selected = "", onChange }) {
  const counts = subjectCounts(questions);
  const subjects = Object.keys(counts).sort((a, b) => {
    if (a === UNASSIGNED) return 1; // keep "no subject" last
    if (b === UNASSIGNED) return -1;
    return a.localeCompare(b);
  });
  if (subjects.length <= 1) return null; // only one subject — nothing to break down

  const chipClass = (active) =>
    `rounded-full border px-3 py-1 text-xs font-semibold transition ${
      active
        ? "border-brand-500 bg-brand-600 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    }`;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</span>
      <button type="button" onClick={() => onChange("")} className={chipClass(!selected)}>
        All ({questions.length})
      </button>
      {subjects.map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className={chipClass(selected === s)}>
          {s} ({counts[s]})
        </button>
      ))}
    </div>
  );
}

// Filter a question list to a selected subject ("" = all).
export function filterBySubject(list, subject) {
  const arr = Array.isArray(list) ? list : [];
  if (!subject) return arr;
  return arr.filter((q) => questionSubject(q) === subject);
}
