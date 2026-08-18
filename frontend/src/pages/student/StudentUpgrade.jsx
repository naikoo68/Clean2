import { useEffect, useState } from "react";
import { Crown, Tag, Gift, Loader2, AlarmClock, ShieldCheck, GraduationCap, Check } from "lucide-react";
import { authService, studentSubscriptionService } from "../../services";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import PlanPicker from "../../components/client/PlanPicker";

// Prices mirror the backend student catalog — used only until the live
// /auth/student-plans response arrives, so the form never renders empty.
const FALLBACK_PLANS = [
  { key: "trial", label: "1-Day Free Trial", cycle: "Trial", months: 0, price: 0, trial: true },
  { key: "1m", label: "1 Month", cycle: "Monthly", months: 1, price: 149 },
  { key: "3m", label: "3 Months", cycle: "Quarterly", months: 3, price: 399 },
  { key: "6m", label: "6 Months", cycle: "Semi-Annually", months: 6, price: 699 },
  { key: "1y", label: "1 Year", cycle: "Yearly", months: 12, price: 899 },
];

// Everything a student subscription unlocks — shown as reassurance.
const PERKS = [
  "Attempt full test-series & quizzes",
  "Personal performance Dashboard & analytics",
  "Track your streak, rank & progress",
];

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// Shown to a student who has no active subscription (or whose plan/trial
// lapsed). Lets them pick a plan, apply a coupon/referral, pay via Razorpay
// (or claim the free trial once), and instantly regain access.
export default function StudentUpgrade({ onClose }) {
  const { user, refreshUser } = useAuth();
  const { settings } = useSettings();
  // The one-time free trial is only offered if it hasn't been claimed yet.
  const trialUsed = !!user?.studentTrialUsed;
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [planKey, setPlanKey] = useState(trialUsed ? "1m" : "trial");
  const [coupon, setCoupon] = useState("");
  const [referral, setReferral] = useState("");
  const [offer, setOffer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    authService
      .studentPlans()
      .then((r) => {
        if (r?.plans?.length) {
          const list = trialUsed ? r.plans.filter((p) => !(p.trial || p.key === "trial")) : r.plans;
          setPlans(list);
        }
      })
      .catch(() => {});
  }, [trialUsed]);

  // Live price preview (debounced) when the plan or codes change.
  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      authService
        .validateOffer({ plan: planKey, couponCode: coupon, referralCode: referral, email: user?.email, audience: "student" })
        .then((r) => active && setOffer(r))
        .catch(() => active && setOffer(null));
    }, 400);
    return () => { active = false; clearTimeout(t); };
  }, [planKey, coupon, referral, user?.email]);

  const selectedPlan = plans.find((p) => p.key === planKey) || plans[0];
  const isFreePlan = !!selectedPlan?.trial || (selectedPlan?.price ?? 0) <= 0;
  const basePrice = offer?.basePrice ?? selectedPlan?.price ?? 0;
  const discount = offer?.discount ?? 0;
  const total = offer?.finalPrice ?? selectedPlan?.price ?? 0;
  const expired = user?.studentPlanExpiresAt && new Date(user.studentPlanExpiresAt).getTime() < Date.now();
  const wasTrial = user?.studentTrial;

  const handlePickPlan = (key) => {
    setPlanKey(key);
    const p = plans.find((x) => x.key === key);
    if (p && (p.trial || (p.price ?? 0) <= 0)) { setCoupon(""); setReferral(""); }
  };

  const codes = () => ({ plan: planKey, couponCode: coupon.trim() || undefined, referralCode: referral.trim() || undefined });

  const subscribe = async () => {
    setBusy(true);
    setError("");
    try {
      const order = await studentSubscriptionService.order(codes());
      if (order.free) {
        // Free trial or ₹0/payments-off → activate directly.
        await studentSubscriptionService.activate(codes());
      } else {
        const ready = await loadRazorpay();
        if (!ready) throw new Error("Couldn't open the payment window. Check your connection and try again.");
        await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: order.keyId,
            order_id: order.orderId,
            amount: order.amount,
            currency: order.currency || "INR",
            name: settings?.siteName || "My Study Guide",
            image: settings?.logoUrl || undefined,
            description: `${selectedPlan?.label} student plan`,
            prefill: { name: user?.name, email: user?.email },
            theme: { color: settings?.primaryColor || "#2563eb" },
            handler: async (resp) => {
              try {
                await studentSubscriptionService.activate({
                  ...codes(),
                  razorpay_order_id: resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature: resp.razorpay_signature,
                });
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            modal: { ondismiss: () => reject(new Error("Payment was cancelled.")) },
          });
          rzp.on("payment.failed", (r) => reject(new Error(r?.error?.description || "Payment failed. Please try again.")));
          rzp.open();
        });
      }
      await refreshUser(); // extends validity → gated features unlock automatically
      if (onClose) onClose();
    } catch (e) {
      setError(e.message || "Subscription failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const cta = () => {
    if (busy) return "Processing…";
    if (planKey === "trial") return "Start 1-day free trial";
    return `Subscribe · ₹${total}`;
  };

  return (
    <div className="mx-auto max-w-lg">
      {onClose && (
        <button onClick={onClose} className="mb-3 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400">
          ← Back
        </button>
      )}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${expired ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" : "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"}`}>
            {expired ? <AlarmClock className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
          </span>
          <div>
            <h1 className="text-xl font-extrabold">
              {expired ? (wasTrial ? "Your free trial has ended" : "Your plan has expired") : "Unlock your full study toolkit"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Subscribe to attempt quizzes &amp; test-series and see your performance Dashboard.
            </p>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /> <span>{p}</span>
            </li>
          ))}
        </ul>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{error}</div>
        )}

        {/* Plans — choose a billing cycle, then a plan */}
        <div className="mt-5">
          <PlanPicker plans={plans} value={planKey} onChange={handlePickPlan} includeTrial={!trialUsed} />
        </div>

        {/* Coupon + referral — hidden for the free trial (nothing to discount) */}
        {!isFreePlan && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Coupon code <span className="font-normal text-slate-400">(optional)</span></label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" className="input pl-9 uppercase" />
              </div>
              {offer?.applied?.coupon?.invalid && <p className="mt-1 text-xs text-rose-600">Invalid coupon code</p>}
              {offer?.applied?.coupon?.label && <p className="mt-1 text-xs text-emerald-600">✓ {offer.applied.coupon.label} applied</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Referral code <span className="font-normal text-slate-400">(optional)</span></label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="Friend's code" className="input pl-9 uppercase" />
              </div>
              {offer?.applied?.referral?.invalid && <p className="mt-1 text-xs text-rose-600">Referral code not found</p>}
              {offer?.applied?.referral?.discount > 0 && <p className="mt-1 text-xs text-emerald-600">✓ ₹{offer.applied.referral.discount} referral discount</p>}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">{selectedPlan?.label} plan</span>
            <span className={discount > 0 ? "text-slate-400 line-through" : "font-semibold"}>{isFreePlan ? "Free" : `₹${basePrice}`}</span>
          </div>
          {discount > 0 && (
            <div className="mt-1 flex items-center justify-between text-emerald-600"><span>Discount</span><span>−₹{discount}</span></div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-extrabold dark:border-slate-700"><span>Total</span><span>{isFreePlan ? "Free" : `₹${total}`}</span></div>
        </div>

        <button onClick={subscribe} disabled={busy} className="btn-primary mt-4 w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
          {cta()}
        </button>
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {planKey === "trial" ? "Free 1-day trial — no payment needed." : "Secure payment via Razorpay · activates instantly"}
        </p>
      </div>
    </div>
  );
}
