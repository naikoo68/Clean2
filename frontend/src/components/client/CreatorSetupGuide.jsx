import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Wrench, RefreshCw, Feather, CheckCircle2, ArrowRight, Loader2, Rocket, X, PartyPopper } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { aiService, authService, practiceService } from "../../services";

// First-run CREATOR setup guide — a step-by-step POPUP tour shown to a creator
// (role "client") until they've completed all four onboarding steps:
//   1. Add their own AI API key        (AI tab)      → detected: ownKeys >= 1
//   2. Build their first question      (Build tab)   → detected: questionCount >= 1
//   3. Regenerate a question           (Build tab)   → detected: creatorGuide.regenerated
//   4. Extend an explanation           (Build tab)   → detected: creatorGuide.extended
//
// UX: instead of a static checklist, the guide shows ONE popup at a time for the
// current step. "Take me there" jumps to the right tab and minimises the popup
// (to a small floating pill) so the creator can actually do the task. Each step
// is detected automatically — steps 1–2 from live data, 3–4 from server-side
// flags the backend records when the creator performs the action — and the very
// moment a step completes the popup springs back up with the NEXT step. Once all
// four are done a final "you're all set" popup lets them finish; completing it
// marks the guide done server-side so it never shows again.
//
// `onGoTab(tabKey)` switches the workspace to the tab where a step is performed.
export default function CreatorSetupGuide({ onGoTab }) {
  const { user, refreshUser } = useAuth();
  const [ownKeys, setOwnKeys] = useState(null); // number of the creator's own API keys
  const [questionCount, setQuestionCount] = useState(null); // total questions they've built
  const [checking, setChecking] = useState(true);
  const [minimized, setMinimized] = useState(false); // popup collapsed to the floating pill
  const [finishing, setFinishing] = useState(false); // marking the guide complete
  const prevActiveRef = useRef(undefined); // track step changes to re-surface the popup

  // Pull the two pieces of live state (own API keys + built questions) and
  // refresh the profile (which carries the regenerate/extend flags). Runs on a
  // timer + focus so the tour keeps up as the creator does each step.
  const check = useCallback(async () => {
    try {
      const [access] = await Promise.all([
        aiService.access().catch(() => null),
        refreshUser?.().catch(() => {}),
      ]);
      if (access) setOwnKeys(Number(access.ownKeys || 0));
      try {
        const items = await practiceService.myItems();
        const total = (items || []).reduce((s, i) => s + (i.questionCount || 0), 0);
        setQuestionCount(total);
      } catch { /* keep previous value */ }
    } finally {
      setChecking(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const id = setInterval(check, 6000); // keep progress in sync while working
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(id);
    };
  }, [check]);

  // Per-step completion. Steps 1–2 come from live data; 3–4 from server flags.
  const done = {
    key: (ownKeys ?? 0) >= 1,
    build: (questionCount ?? 0) >= 1,
    regen: user?.creatorGuide?.regenerated === true,
    extend: user?.creatorGuide?.extended === true,
  };

  const STEPS = [
    {
      k: "key", n: 1, Icon: KeyRound, done: done.key, tab: "ai", cta: "Take me to the AI tab",
      title: "Add your AI API key",
      desc: 'Open the AI tab, choose "My own APIs", and add a provider key. This powers every AI tool you\'ll use next.',
    },
    {
      k: "build", n: 2, Icon: Wrench, done: done.build, tab: "build", cta: "Take me to Build",
      title: "Build your first question",
      desc: "In the Build tab, create a quiz (or test) and add a question to it. This is your own private practice content.",
    },
    {
      k: "regen", n: 3, Icon: RefreshCw, done: done.regen, tab: "build", cta: "Take me to Build",
      title: "Regenerate a question",
      desc: 'Open a question and tap "Regenerate" — the AI rebuilds its options, answer and explanation to fit the stem.',
    },
    {
      k: "extend", n: 4, Icon: Feather, done: done.extend, tab: "build", cta: "Take me to Build",
      title: "Extend an explanation",
      desc: 'Open a question and tap "Extend explanation" to enrich its explanation with the AI.',
    },
  ];

  const total = STEPS.length;
  const doneCount = STEPS.filter((s) => s.done).length;
  // The step the creator should do next = the first not-yet-done step.
  const activeIndex = STEPS.findIndex((s) => !s.done);
  const allDone = activeIndex === -1;
  const step = allDone ? null : STEPS[activeIndex];

  // Whenever the active step changes (a step just got completed, or we finished
  // the whole tour), pop the guide back up so the creator sees the next step /
  // the finish screen — even if they'd minimised it.
  useEffect(() => {
    const key = allDone ? "done" : activeIndex;
    if (prevActiveRef.current === undefined) { prevActiveRef.current = key; return; }
    if (key !== prevActiveRef.current) {
      prevActiveRef.current = key;
      setMinimized(false);
    }
  }, [activeIndex, allDone]);

  // Finish the tour: persist completion so it never reappears, then let the
  // workspace hide this component (creatorGuide.completed flips to true).
  const finish = async () => {
    setFinishing(true);
    try {
      await authService.completeCreatorGuide();
      await refreshUser?.();
    } catch { /* will retry from the finish popup next time */ }
    finally { setFinishing(false); }
  };

  const goToStep = () => {
    if (!step) return;
    onGoTab?.(step.tab);
    setMinimized(true); // step aside so they can actually do the task
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* no-op */ }
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
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {doneCount}/{total}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
      {/* Backdrop — tap to minimise (not dismiss; the tour resumes automatically). */}
      <button
        type="button"
        aria-label="Minimise setup guide"
        onClick={() => setMinimized(true)}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />

      <div role="dialog" aria-modal="true" className="relative w-full max-w-md animate-scale-in rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-6">
        {/* Minimise (do it later) */}
        {!allDone && (
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label="Do this later"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Progress bar + count */}
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {checking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {doneCount}/{total}
          </span>
        </div>

        {allDone ? (
          /* ---- Finish screen ---- */
          <div className="mt-5 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-500 text-white">
              <PartyPopper className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-extrabold">You're all set!</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              You've added a key, built a question, and used the AI to regenerate and extend it. Your creator workspace is ready to go.
            </p>
            <button type="button" onClick={finish} disabled={finishing} className="btn-primary mt-6 w-full justify-center">
              {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start creating <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        ) : (
          /* ---- Current step ---- */
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white">
                <step.Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">Step {step.n} of {total}</p>
                <h2 className="text-lg font-extrabold leading-tight">{step.title}</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.desc}</p>

            {/* Steps already completed, for a sense of progress */}
            {doneCount > 0 && (
              <div className="mt-4 space-y-1.5">
                {STEPS.filter((s) => s.done).map((s) => (
                  <p key={s.k} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> <span className="text-slate-400 line-through dark:text-slate-500">{s.title}</span>
                  </p>
                ))}
              </div>
            )}

            <button type="button" onClick={goToStep} className="btn-primary mt-6 w-full justify-center">
              {step.cta} <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">
              This popup will move to the next step automatically once you're done.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
