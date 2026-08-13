import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Crown, Loader2 } from "lucide-react";
import { authService, paymentService } from "../services";
import { useSettings } from "../context/SettingsContext";

// Prices mirror the backend defaults so the page never renders empty while the
// live /auth/plans response is loading.
const FALLBACK_PLANS = [
  { key: "trial", label: "1-Day Free Trial", months: 0, price: 0, trial: true },
  { key: "1m", label: "1 Month", months: 1, price: 299 },
  { key: "2m", label: "2 Months", months: 2, price: 499 },
  { key: "6m", label: "6 Months", months: 6, price: 699 },
  { key: "1y", label: "1 Year", months: 12, price: 899 },
];

// Everything a Client account unlocks — shown on every card so buyers see the
// full value regardless of the plan length they pick.
const FEATURES = [
  "Your own private My Practice workspace",
  "AI question generator",
  "Build quizzes, tests & previous papers",
  "Answer checker & auto-generated notes",
  "Upload documents & study material",
  "Performance analytics & progress tracking",
];

// Public pricing page: shows the Client subscription plans and sends the
// visitor to the existing self-service registration (which handles Razorpay).
export default function Pricing() {
  const { settings } = useSettings();
  const site = settings?.siteName || "My Study Guide";
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loading, setLoading] = useState(true);
  const [payEnabled, setPayEnabled] = useState(false);

  useEffect(() => {
    authService
      .plans()
      .then((r) => { if (r?.plans?.length) setPlans(r.plans); })
      .catch(() => {})
      .finally(() => setLoading(false));
    paymentService.config().then((r) => setPayEnabled(!!r?.enabled)).catch(() => {});
  }, []);

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
          Start free, upgrade anytime. Every {site} Client plan includes the full toolkit —
          longer plans simply cost less per month and unlock higher AI limits.
        </p>
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

              {p.maxPerBatch ? (
                <p className="mt-2 rounded-lg bg-brand-50/70 px-2 py-1.5 text-[11px] font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                  AI: {p.maxPerBatch}/batch · {p.perWindow}/{p.windowMinutes || 5}min
                </p>
              ) : null}

              <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/client/register"
                state={{ plan: p.key }}
                className={`mt-5 w-full ${isPopular ? "btn-primary" : "btn-outline"}`}
              >
                {isFree ? "Start free trial" : "Choose plan"}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Reassurance / footer note */}
      <div className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500 dark:text-slate-400">
        {payEnabled ? (
          <p>Secure payments via Razorpay. Your account activates instantly for the selected duration.</p>
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
