import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Crown, Loader2, GraduationCap, Store } from "lucide-react";
import { authService, paymentService } from "../services";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

// Prices mirror the backend defaults so the page never renders empty while the
// live plan responses are loading.
const FALLBACK_CLIENT_PLANS = [
  { key: "trial", label: "1-Day Free Trial", months: 0, price: 0, trial: true },
  { key: "1m", label: "1 Month", months: 1, price: 299 },
  { key: "2m", label: "2 Months", months: 2, price: 499 },
  { key: "6m", label: "6 Months", months: 6, price: 699 },
  { key: "1y", label: "1 Year", months: 12, price: 899 },
];
const FALLBACK_STUDENT_PLANS = [
  { key: "trial", label: "1-Day Free Trial", months: 0, price: 0, trial: true },
  { key: "1m", label: "1 Month", months: 1, price: 149 },
  { key: "3m", label: "3 Months", months: 3, price: 399 },
  { key: "6m", label: "6 Months", months: 6, price: 699 },
  { key: "1y", label: "1 Year", months: 12, price: 899 },
];

// Everything a Client account unlocks.
const CLIENT_FEATURES = [
  "Your own private My Practice workspace",
  "AI question generator",
  "Build quizzes, tests & previous papers",
  "Answer checker & auto-generated notes",
  "Upload documents & study material",
  "Performance analytics & progress tracking",
];
// Everything a Student subscription unlocks.
const STUDENT_FEATURES = [
  "Attempt full test-series & quizzes",
  "Personal performance Dashboard & analytics",
  "Track your streak, rank & progress",
  "Browse the full question bank",
  "Take timed mock tests",
  "Instant solutions & explanations",
];

// Public pricing page. A segmented toggle switches between the STUDENT plans
// (learners who subscribe to attempt quizzes/tests & unlock analytics) and the
// CLIENT plans (self-service creators who get their own My Practice workspace).
export default function Pricing() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const site = settings?.siteName || "My Study Guide";
  const [audience, setAudience] = useState("student"); // "student" | "client"
  const [clientPlans, setClientPlans] = useState(FALLBACK_CLIENT_PLANS);
  const [studentPlans, setStudentPlans] = useState(FALLBACK_STUDENT_PLANS);
  const [loading, setLoading] = useState(true);
  const [payEnabled, setPayEnabled] = useState(false);

  useEffect(() => {
    Promise.all([
      authService.plans().then((r) => { if (r?.plans?.length) setClientPlans(r.plans); }).catch(() => {}),
      authService.studentPlans().then((r) => { if (r?.plans?.length) setStudentPlans(r.plans); }).catch(() => {}),
    ]).finally(() => setLoading(false));
    paymentService.config().then((r) => setPayEnabled(!!r?.enabled)).catch(() => {});
  }, []);

  const isStudent = audience === "student";
  const plans = isStudent ? studentPlans : clientPlans;
  const features = isStudent ? STUDENT_FEATURES : CLIENT_FEATURES;

  // Trial first, then paid plans cheapest → dearest.
  const sorted = useMemo(
    () => [...plans].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
    [plans]
  );
  // Highlight the longest paid plan as the best value.
  const popularKey = useMemo(() => {
    const paid = sorted.filter((p) => !(p.trial || (p.price ?? 0) <= 0));
    return paid.reduce((best, p) => ((p.months || 0) > (best?.months || 0) ? p : best), null)?.key;
  }, [sorted]);

  const perMonth = (p) =>
    p.months > 1 && p.price > 0 ? `≈ ₹${Math.round(p.price / p.months)}/mo` : null;

  // Where a plan's CTA sends the visitor.
  const ctaTarget = (p) => {
    if (isStudent) {
      // Logged-in user → the subscribe page; a guest signs up free first, then
      // the paywall guides them to subscribe.
      return user ? { to: "/subscribe" } : { to: "/register" };
    }
    return { to: "/client/register", state: { plan: p.key } };
  };

  return (
    <div className="container-page py-10 sm:py-14">
      {/* Hero */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
          <Sparkles className="h-3.5 w-3.5" /> Plans & Pricing
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          {isStudent
            ? `Practice free, subscribe to unlock full test-series, quizzes and your ${site} performance dashboard — longer plans cost less per month.`
            : `Every ${site} Client plan includes the full toolkit — longer plans simply cost less per month and unlock higher AI limits.`}
        </p>
      </div>

      {/* Audience toggle */}
      <div className="mx-auto mt-6 flex max-w-xs items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
        <button
          onClick={() => setAudience("student")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isStudent ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          <GraduationCap className="h-4 w-4" /> For Students
        </button>
        <button
          onClick={() => setAudience("client")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            !isStudent ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          <Store className="h-4 w-4" /> For Creators
        </button>
      </div>

      {loading && (
        <div className="mt-8 flex justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Plan cards */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {sorted.map((p) => {
          const isFree = p.trial || (p.price ?? 0) <= 0;
          const isPopular = p.key === popularKey;
          const target = ctaTarget(p);
          return (
            <div
              key={p.key}
              className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-900 ${
                isPopular
                  ? "border-brand-500 ring-2 ring-brand-500"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold text-white">
                  <Crown className="h-3 w-3" /> Best value
                </span>
              )}

              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.label}</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-3xl font-extrabold">{isFree ? "Free" : `₹${p.price}`}</span>
              </div>
              <p className="mt-0.5 h-4 text-xs text-slate-500 dark:text-slate-400">{perMonth(p) || ""}</p>

              {/* AI limits only apply to Client plans */}
              {!isStudent && p.maxPerBatch ? (
                <p className="mt-2 rounded-lg bg-brand-50/70 px-2 py-1.5 text-[11px] font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                  AI: {p.maxPerBatch}/batch · {p.perWindow}/{p.windowMinutes || 5}min
                </p>
              ) : null}

              <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={target.to}
                state={target.state}
                className={`mt-5 w-full ${isPopular ? "btn-primary" : "btn-outline"}`}
              >
                {isFree ? (isStudent ? "Start free" : "Start free trial") : "Choose plan"}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Reassurance / footer note */}
      <div className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500 dark:text-slate-400">
        {payEnabled ? (
          <p>Secure payments via Razorpay. Your {isStudent ? "subscription" : "account"} activates instantly for the selected duration.</p>
        ) : (
          <p>Create your account and verify your email to get started.</p>
        )}
        <p className="mt-2">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
