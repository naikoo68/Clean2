import { api } from "./api";

// Build the shareable PUBLIC link for a quiz/test token.
//
// We point at the backend's server-rendered "/s/:token" HTML endpoint (NOT the
// SPA hash route). Social apps like WhatsApp and Facebook never run JavaScript,
// so they can only read Open Graph tags that exist in the initial HTML. The SPA
// is a hash-router that boots via JS, so a "#/public/..." link always shows the
// generic site card. The backend endpoint returns per-item og: tags (subject,
// topic, the quiz/test name and its first question) for a rich preview, then
// redirects a human visitor on to the real in-app player.
//
// Falls back to the old in-app hash URL if the API origin can't be determined
// (e.g. VITE_API_URL unset in local dev).
export function publicShareUrl(token, kind) {
  const origin = String(api.baseUrl || "").replace(/\/api\/?$/, "");
  if (origin && /^https?:\/\//.test(origin)) return `${origin}/s/${token}`;
  const k = kind === "quiz" || kind === "My Quiz" ? "quiz" : "test";
  return `${window.location.origin}${window.location.pathname}#/public/${k}/${token}`;
}
