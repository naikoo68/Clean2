import { useEffect } from "react";

// Per-page SEO. Now that the app uses path-based routing (BrowserRouter), each
// route is a real, crawlable URL — so giving each page its own <title> and
// description (plus OG/Twitter) actually helps search & social sharing.
//
// Usage inside a page component:  useSeo("Quizzes", "Practise subject-wise …");
// Call with no args on the homepage to fall back to the site defaults.

const SITE = "My Study Guide";
const DEFAULT_TITLE = "My Study Guide — Prepare Smart, Achieve More";
const DEFAULT_DESC =
  "My Study Guide offers subject-wise quizzes, mock tests, test series, instant results, performance analytics and study resources for competitive exam preparation.";

function upsertMeta(attr, key, content) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeo(title, description) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
  }, [title, description]);
}
