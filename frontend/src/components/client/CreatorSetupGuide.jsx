import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Layers, BookOpen, FolderOpen, ListChecks, HelpCircle, RefreshCw, Feather, CheckCircle2, ArrowRight, Loader2, Rocket, X, PartyPopper } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { aiService, authService, practiceService, testService } from "../../services";

// First-run CREATOR setup guide — a step-by-step POPUP that the creator does
// EVERYTHING inside: they type what to add and the popup creates it for them
// (via the API) and advances to the next step — no jumping to the Build tab and
// getting bounced around. It walks the full My-Quiz build flow, then the two AI
// tools, one popup at a time:
//   1. Add your AI API key   (paste key)      → aiService.keys.create + mode "self"
//   2. Add a stream          (type a name)    → practiceService.createStream
//   3. Add a subject         (type a name)    → createSubject (under the stream)
//   4. Add a topic           (type a name)    → createTopic (under the subject)
//   5. Add a quiz            (type a name)    → createItem (quiz under the topic)
//   6. Add a question        (stem+4 options) → testService.addQuestion (in the quiz)
//   7. Regenerate a question (one tap)        → aiService.regenerate on that question
//   8. Extend an explanation (one tap)        → aiService.extendOne on that question
//
// Progress is remembered by what actually exists: on open we "hydrate" the
// creator's newest stream → subject → topic → quiz → question so the tour
// resumes exactly where they left off (and steps 7–8 target the real question).
// Completing the last step marks the guide done server-side so it never returns.
//
// `onGoTab(tabKey)` is only used at the very end to drop them into the Build tab.
const EMPTY_Q = { text: "", options: ["", "", "", ""], correct: 0 };

export default function CreatorSetupGuide({ onGoTab }) {
  const { user, refreshUser } = useAuth();
  const [ownKeys, setOwnKeys] = useState(0); // creator's own API keys
  const [ids, setIds] = useState({ stream: null, subject: null, topic: null, quiz: null, question: null });
  const [hydrating, setHydrating] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [busy, setBusy] = useState(false); // a create/AI action is running
  const [error, setError] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [val, setVal] = useState("");     // single-line input (key / names)
  const [q, setQ] = useState(EMPTY_Q);    // the "add a question" form
  const prevActiveRef = useRef(undefined);

  // Resume support: find the creator's newest path through the hierarchy so the
  // tour continues from where they are and the AI steps target a real question.
  const hydrate = useCallback(async () => {
    try {
      const access = await aiService.access().catch(() => null);
      setOwnKeys(Number(access?.ownKeys || 0));
      const next = { stream: null, subject: null, topic: null, quiz: null, question: null };
      const streams = await practiceService.adminStreams("quiz").catch(() => []);
      if (streams.length) {
        next.stream = streams[0]._id;
        const subs = await practiceService.adminSubjects(next.stream).catch(() => []);
        if (subs.length) {
          next.subject = subs[0]._id;
          const topics = await practiceService.adminTopics(next.subject).catch(() => []);
          if (topics.length) {
            next.topic = topics[0]._id;
            const quizzes = await practiceService.adminTopicItems(next.topic).catch(() => []);
            if (quizzes.length) {
              next.quiz = quizzes[0]._id;
              if ((quizzes[0].questionCount || 0) >= 1) {
                const qs = await testService.getQuestions(next.quiz).catch(() => []);
                if (qs.length) next.question = qs[0]._id;
              }
            }
          }
        }
      }
      setIds(next);
    } finally {
      setHydrating(false);
    }
  }, []);

  useEffect(() => { hydrate(); }, [hydrate]);

  const STEPS = [
    { k: "key", Icon: KeyRound, done: ownKeys >= 1, kind: "key", title: "Add your AI API key",
      desc: "Paste a provider API key (e.g. a Google Gemini key). It powers the AI tools you'll use in the last two steps.",
      placeholder: "Paste your API key…", cta: "Save key" },
    { k: "stream", Icon: Layers, done: !!ids.stream, kind: "name", title: "Add a stream",
      desc: 'A broad category for your content, e.g. "JKSSB" or "Class 10".', placeholder: "Stream name", cta: "Add stream" },
    { k: "subject", Icon: BookOpen, done: !!ids.subject, kind: "name", title: "Add a subject",
      desc: 'A subject inside your stream, e.g. "Economics".', placeholder: "Subject name", cta: "Add subject" },
    { k: "topic", Icon: FolderOpen, done: !!ids.topic, kind: "name", title: "Add a topic",
      desc: 'A topic inside your subject, e.g. "Theory of Rent".', placeholder: "Topic name", cta: "Add topic" },
    { k: "quiz", Icon: ListChecks, done: !!ids.quiz, kind: "name", title: "Add a quiz",
      desc: "The quiz that will hold your questions.", placeholder: "Quiz name (e.g. Quiz 1)", cta: "Add quiz" },
    { k: "question", Icon: HelpCircle, done: !!ids.question, kind: "question", title: "Add a question",
      desc: "Type your question and its four options, and mark the correct one.", cta: "Add question" },
    { k: "regen", Icon: RefreshCw, done: user?.creatorGuide?.regenerated === true, kind: "regen", title: "Regenerate the question",
      desc: "Let the AI analyse your question and rebuild its options, answer and explanation to fit the stem.", cta: "Regenerate with AI" },
    { k: "extend", Icon: Feather, done: user?.creatorGuide?.extended === true, kind: "extend", title: "Extend the explanation",
      desc: "Let the AI enrich your question's explanation so learners understand the 'why'.", cta: "Extend with AI" },
  ];

  const total = STEPS.length;
  const doneCount = STEPS.filter((s) => s.done).length;
  const activeIndex = STEPS.findIndex((s) => !s.done);
  const allDone = activeIndex === -1;
  const step = allDone ? null : STEPS[activeIndex];

  // Reset the inputs and re-open the popup whenever the active step changes.
  useEffect(() => {
    setVal("");
    setQ(EMPTY_Q);
    setError("");
    const key = allDone ? "done" : activeIndex;
    if (prevActiveRef.current === undefined) { prevActiveRef.current = key; return; }
    if (key !== prevActiveRef.current) { prevActiveRef.current = key; setMinimized(false); }
  }, [activeIndex, allDone]);

  // Perform the current step's action (create the item / run the AI tool).
  const doStep = async () => {
    if (!step || busy) return;
    setBusy(true);
    setError("");
    try {
      if (step.kind === "key") {
        const key = val.trim();
        if (!key) throw new Error("Please paste your API key.");
        await aiService.keys.create({ key });
        await aiService.setMode("self").catch(() => {}); // use their own key for the AI steps
        setOwnKeys((n) => n + 1);
      } else if (step.kind === "name") {
        const name = val.trim();
        if (!name) throw new Error("Please enter a name.");
        if (step.k === "stream") {
          const s = await practiceService.createStream({ name, kind: "quiz" });
          setIds((p) => ({ ...p, stream: s._id }));
        } else if (step.k === "subject") {
          const s = await practiceService.createSubject({ name, stream: ids.stream });
          setIds((p) => ({ ...p, subject: s._id }));
        } else if (step.k === "topic") {
          const t = await practiceService.createTopic({ name, subject: ids.subject });
          setIds((p) => ({ ...p, topic: t._id }));
        } else if (step.k === "quiz") {
          const it = await practiceService.createItem({
            name, practiceStream: ids.stream, practiceSubject: ids.subject, practiceTopic: ids.topic, practiceKind: "quiz",
          });
          setIds((p) => ({ ...p, quiz: it._id }));
        }
      } else if (step.kind === "question") {
        const text = q.text.trim();
        const options = q.options.map((o) => o.trim());
        if (!text) throw new Error("Please type the question.");
        if (options.some((o) => !o)) throw new Error("Please fill in all four options.");
        const created = await testService.addQuestion(ids.quiz, { type: "mcq", text, options, correct: q.correct });
        setIds((p) => ({ ...p, question: created._id }));
      } else if (step.kind === "regen") {
        await aiService.regenerate({ questionId: ids.question });
        await refreshUser?.(); // picks up creatorGuide.regenerated
      } else if (step.kind === "extend") {
        await aiService.extendOne({ questionId: ids.question });
        await refreshUser?.(); // picks up creatorGuide.extended
      }
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await authService.completeCreatorGuide();
      await refreshUser?.();
      onGoTab?.("build");
    } catch { /* retry next time */ }
    finally { setFinishing(false); }
  };

  // Minimised → a small floating pill that shows progress and reopens the popup.
  if (minimized && !allDone) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-lg transition hover:border-brand-400 dark:border-brand-900/50 dark:bg-slate-900 dark:text-slate-200"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-500 text-white">
          <Rocket className="h-3.5 w-3.5" />
        </span>
        Setup guide
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{doneCount}/{total}</span>
      </button>
    );
  }

  const busyLabel = step?.kind === "regen" || step?.kind === "extend" ? "Working with AI…" : "Saving…";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button type="button" aria-label="Minimise setup guide" onClick={() => setMinimized(true)} className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm" />

      <div role="dialog" aria-modal="true" className="relative max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-6">
        {!allDone && (
          <button type="button" onClick={() => setMinimized(true)} aria-label="Do this later" className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {hydrating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{doneCount}/{total}
          </span>
        </div>

        {allDone ? (
          <div className="mt-5 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-500 text-white"><PartyPopper className="h-7 w-7" /></span>
            <h2 className="mt-4 text-xl font-extrabold">You're all set!</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              You've added a key and built a full stream → subject → topic → quiz → question, then used the AI to regenerate and extend it. Your workspace is ready.
            </p>
            <button type="button" onClick={finish} disabled={finishing} className="btn-primary mt-6 w-full justify-center">
              {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start creating <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white"><step.Icon className="h-6 w-6" /></span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">Step {activeIndex + 1} of {total}</p>
                <h2 className="text-lg font-extrabold leading-tight">{step.title}</h2>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.desc}</p>

            {/* Input area for the current step */}
            <div className="mt-4">
              {step.kind === "question" ? (
                <div className="space-y-2.5">
                  <textarea
                    value={q.text}
                    onChange={(e) => setQ((p) => ({ ...p, text: e.target.value }))}
                    placeholder="Type your question…"
                    className="input min-h-[72px]"
                    autoFocus
                  />
                  {q.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={q.correct === i}
                        onChange={() => setQ((p) => ({ ...p, correct: i }))}
                        title="Mark as the correct answer"
                        className="h-4 w-4 flex-shrink-0 accent-brand-600"
                      />
                      <input
                        value={opt}
                        onChange={(e) => setQ((p) => { const options = [...p.options]; options[i] = e.target.value; return { ...p, options }; })}
                        placeholder={`Option ${i + 1}${q.correct === i ? " (correct)" : ""}`}
                        className="input flex-1"
                      />
                    </label>
                  ))}
                  <p className="text-xs text-slate-400">Tip: fill all four options and select the round button next to the correct one.</p>
                </div>
              ) : step.kind === "name" || step.kind === "key" ? (
                <input
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") doStep(); }}
                  placeholder={step.placeholder}
                  className="input"
                  autoFocus
                  type={step.kind === "key" ? "password" : "text"}
                  autoCapitalize={step.kind === "key" ? "none" : "sentences"}
                  spellCheck={step.kind !== "key"}
                />
              ) : null}

              {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</p>}
            </div>

            {/* Steps already completed */}
            {doneCount > 0 && (
              <div className="mt-4 space-y-1.5">
                {STEPS.filter((s) => s.done).map((s) => (
                  <p key={s.k} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> <span className="text-slate-400 line-through dark:text-slate-500">{s.title}</span>
                  </p>
                ))}
              </div>
            )}

            <button type="button" onClick={doStep} disabled={busy} className="btn-primary mt-5 w-full justify-center">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {busyLabel}</> : <>{step.cta} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
