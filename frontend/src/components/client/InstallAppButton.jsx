import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

// Shows an "Install app" control in the client workspace:
// • Android / desktop Chrome-family: a real install button that fires the
//   browser's native install prompt (via the captured beforeinstallprompt).
// • iOS Safari (no native prompt): a small button that opens Add-to-Home-Screen
//   instructions.
// • If the app is already installed (running standalone), it renders nothing.
export default function InstallAppButton() {
  const [deferred, setDeferred] = useState(null);
  const [iosHint, setIosHint] = useState(false);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true);
  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault(); // stop the mini-infobar; we show our own button
      setDeferred(e);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone) return null; // already installed

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setDeferred(null);
  };

  // Native install available (Android / desktop).
  if (deferred) {
    return (
      <button
        onClick={install}
        title="Install this app"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Install app</span>
      </button>
    );
  }

  // iOS Safari — offer instructions (no programmatic prompt exists there).
  if (isIos) {
    return (
      <>
        <button
          onClick={() => setIosHint(true)}
          title="Install this app"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Install</span>
        </button>
        {iosHint && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" onClick={() => setIosHint(false)}>
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIosHint(false)} aria-label="Close" className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-bold">Install this app</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                On iPhone/iPad, add it to your Home Screen:
              </p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
                <li>Tap the <span className="inline-flex items-center gap-1 font-semibold">Share <Share className="h-4 w-4" /></span> button in Safari's toolbar.</li>
                <li>Choose <span className="font-semibold">“Add to Home Screen”</span>.</li>
                <li>Tap <span className="font-semibold">Add</span> — the app icon appears on your Home Screen.</li>
              </ol>
              <button onClick={() => setIosHint(false)} className="btn-primary mt-5 w-full">Got it</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null; // not installable yet (or unsupported browser)
}
