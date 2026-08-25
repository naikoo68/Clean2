import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Wrench, RefreshCw, Feather, CheckCircle2, Lock, ArrowRight, Loader2, Rocket } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { aiService, authService, practiceService } from "../../services";

// First-run CREATOR setup guide — a compulsory, step-by-step checklist shown to
// a creator (role "client") until they've completed all four onboarding steps:
//   1. Add their own AI API key        (AI tab)      → detected: ownKeys >= 1
//   2. Build their first question      (Build tab)   → detected: questionCount >= 1
//   3. Regenerate a question           (Build tab)   → detected: creatorGuide.regenerated
//   4. Extend an explanation           (Build tab)   → detected: creatorGuide.extended
//
// Steps are STRICTLY ORDERED: a step only unlocks once every step before it is
// done, so the creator is walked through them one at a time. Completion of each
// step is detected automatically (no manual "mark done"): steps 1–2 from live
// data, steps 3–4 from server-side flags the backend records when the creator
// actually performs the action. The guide re-checks on mount, on window focus,
// and on a short interval while still open, so progress ticks over on its own
// as the creator works. Once all four are done it marks itself complete
// (server-side) and disappears for good.
//
// `onGoTab(tabKey)` switches the workspace to the tab where a step is performed.
export default function CreatorSetupGuide({ onGoTab }) {
  const { user, refreshUser } = useAuth();
  const [ownKeys, setOwnKeys] = useState(null); // number of the creator's own API keys
  const [questionCount, setQuestionCount] = useState(null); // total questions they've built
  const [checking, setChecking] = useState(true);
  const markingRef = useRef(false); // guard so we only POST "completed" once

  // Pull the two pieces of live state (own API keys + built questions) and
  // refresh the profile (which carries the regenerate/extend flags). Runs on a
  // timer + focus so the checklist keeps up as the creator does each step.
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
    const id = setInterval(check, 8000); // keep progress in sync while working
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
      k: "key", Icon: KeyRound, done: done.key, tab: "ai", cta: "Open AI tab",
      title: "Add your AI API key",
      desc: 'Open the AI tab, choose "My own APIs", and add a provider key. This powers every AI tool below.',
    },
    {
      k: "build", Icon: Wrench, done: done.build, tab: "build", cta: "Open Build tab",
      title: "Build your first question",
      desc: "Go to the Build tab, create a quiz (or test), and add a question to it.",
    },
    {
      k: "regen", Icon: RefreshCw, done: done.regen, tab: "build", cta: "Go to Build",
      title: "Regenerate a question",
      desc: 'Open a question and use "Regenerate" — the AI rebuilds its options, answer and explanation to fit the stem.',
    },
    {
      k: "extend", Icon: Feather, done: done.extend, tab: "build", cta: "Go to Build",
      title: "Extend an explanation",
      desc: 'Open a question and use "Extend explanation" to enrich its explanation with the AI.',
    },
  ];

  const doneCount = STEPS.filter((s) => s.done).length;
  // The one step the creator should do next = the first not-yet-done step.
  const activeIndex = STEPS.findIndex((s) => !s.done);
  const allDone = activeIndex === -1;

  // When everything is finished, persist completion once so the guide never
  // reappears, then let the workspace hide it (creatorGuide.completed flips).
  useEffect(() => {
    if (!allDone || markingRef.current || user?.creatorGuide?.completed === true) return;
    markingRef.current = true;
    (async () => {
      try {
        await authService.completeCreatorGuide();
        await refreshUser?.();
      } catch { /* will retry on next mount */ }
      finally { markingRef.current = false; }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, user?.creatorGuide?.completed]);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-sm dark:border-brand-900/50 dark:from-brand-900/20 dark:to-slate-900">
      <div className="flex items-start gap-3 border-b border-brand-100 p-4 dark:border-brand-900/40 sm:p-5">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white">
          <Rocket className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold leading-tight">Finish setting up your creator account</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Complete these {STEPS.length} quick steps to learn the tools. They're required to get started.
          </p>
          {/* Progress */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
              />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {checking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {doneCount}/{STEPS.length} done
            </span>
          </div>
        </div>
      </div>

      <ol className="divide-y divide-brand-100 dark:divide-brand-900/40">
        {STEPS.map((s, i) => {
          const isActive = i === activeIndex;
          const locked = !s.done && !isActive; // a future step whose prerequisites aren't met yet
          return (
            <li key={s.k} className={`flex items-center gap-3 p-4 sm:px-5 ${locked ? "opacity-55" : ""}`}>
              {/* Status icon */}
              <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                  s.done
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : isActive
                    ? "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                }`}
              >
                {s.done ? <CheckCircle2 className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : <s.Icon className="h-5 w-5" />}
              </span>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${s.done ? "text-slate-500 line-through dark:text-slate-500" : ""}`}>
                  <span className="mr-1.5 text-slate-400">{i + 1}.</span>{s.title}
                </p>
                {!s.done && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>}
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                {s.done ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Done
                  </span>
                ) : isActive ? (
                  <button type="button" onClick={() => onGoTab?.(s.tab)} className="btn-primary py-1.5 text-xs">
                    {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400 dark:bg-slate-800">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
