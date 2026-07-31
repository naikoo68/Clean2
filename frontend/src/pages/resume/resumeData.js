// ---------------------------------------------------------------------------
// Resume Builder — data layer (structured JSON, storage, import/export, ATS).
// Everything the builder needs is a single plain-JSON `resume` object, so it's
// trivial to persist, export, import, and render from any template.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mstg.resume.v1";

const uid = () => Math.random().toString(36).slice(2, 10);

// Factory helpers for each repeatable entry — used by "Add" buttons.
export const factories = {
  experience: () => ({ id: uid(), role: "", company: "", location: "", start: "", end: "", current: false, bullets: [""] }),
  education: () => ({ id: uid(), degree: "", school: "", location: "", start: "", end: "", score: "", details: "" }),
  skills: () => ({ id: uid(), name: "", level: "" }),
  projects: () => ({ id: uid(), name: "", link: "", description: "", bullets: [""] }),
  certifications: () => ({ id: uid(), name: "", issuer: "", date: "", link: "" }),
  languages: () => ({ id: uid(), name: "", level: "" }),
  references: () => ({ id: uid(), name: "", relation: "", contact: "" }),
  interests: () => ({ id: uid(), name: "" }),
};

// The order + labels of resume sections (drives nav, visibility, rendering).
export const SECTIONS = [
  { key: "summary", label: "Profile Summary" },
  { key: "experience", label: "Work Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "languages", label: "Languages" },
  { key: "references", label: "References" },
  { key: "interests", label: "Interests" },
];

export function emptyResume() {
  return {
    meta: { name: "My Resume", updatedAt: Date.now() },
    // Look & feel — read by every template.
    theme: { templateId: "classic", accent: "#2563eb", font: "Inter", fontScale: 1 },
    // Which sections show, and in what order (drag/reorder updates this).
    layout: { order: SECTIONS.map((s) => s.key), hidden: {} },
    personal: { fullName: "", title: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "", photo: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    references: [],
    interests: [],
    // Optional cover letter (separate document that shares the header/theme).
    coverLetter: { enabled: false, recipient: "", company: "", body: "" },
  };
}

// A filled-in sample so a first-time user sees a real resume immediately.
export function sampleResume() {
  const r = emptyResume();
  r.meta.name = "Sample Resume";
  r.personal = {
    fullName: "Aarav Sharma", title: "Full-Stack Developer",
    email: "aarav.sharma@example.com", phone: "+91 98765 43210",
    location: "Bengaluru, India", website: "aaravsharma.dev",
    linkedin: "linkedin.com/in/aaravsharma", github: "github.com/aaravsharma", photo: "",
  };
  r.summary = "Full-stack developer with 5+ years building scalable web apps in React and Node.js. Shipped products used by 100k+ users and cut page-load time by 40%. Strong on clean architecture, testing, and mentoring.";
  r.experience = [
    { id: uid(), role: "Senior Software Engineer", company: "TechNova", location: "Bengaluru", start: "2022", end: "", current: true,
      bullets: ["Led a team of 4 to rebuild the billing platform, increasing throughput by 3x.", "Reduced API latency 40% by introducing caching and query optimization.", "Mentored 3 junior engineers to mid-level."] },
    { id: uid(), role: "Software Engineer", company: "WebWorks", location: "Remote", start: "2019", end: "2022", current: false,
      bullets: ["Built a React design system adopted across 6 product teams.", "Automated CI/CD, cutting release time from 2 hours to 15 minutes."] },
  ];
  r.education = [{ id: uid(), degree: "B.Tech, Computer Science", school: "IIT Delhi", location: "New Delhi", start: "2015", end: "2019", score: "8.6 CGPA", details: "" }];
  r.skills = ["JavaScript", "React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "System Design"].map((name) => ({ id: uid(), name, level: "" }));
  r.projects = [{ id: uid(), name: "OpenBudget", link: "github.com/aaravsharma/openbudget", description: "Open-source personal finance tracker.", bullets: ["1.2k GitHub stars; 40+ contributors."] }];
  r.certifications = [{ id: uid(), name: "AWS Solutions Architect \u2013 Associate", issuer: "Amazon", date: "2023", link: "" }];
  r.languages = [{ id: uid(), name: "English", level: "Fluent" }, { id: uid(), name: "Hindi", level: "Native" }];
  r.interests = [{ id: uid(), name: "Open source" }, { id: uid(), name: "Chess" }, { id: uid(), name: "Trekking" }];
  return r;
}

// ---- Persistence (localStorage autosave / draft) --------------------------
export function loadResume() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Merge onto a fresh shape so older drafts stay valid as the model grows.
    return { ...emptyResume(), ...data, theme: { ...emptyResume().theme, ...(data.theme || {}) }, layout: { ...emptyResume().layout, ...(data.layout || {}) }, personal: { ...emptyResume().personal, ...(data.personal || {}) } };
  } catch { return null; }
}
export function saveResume(resume) {
  try {
    const toSave = { ...resume, meta: { ...(resume.meta || {}), updatedAt: Date.now() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch { return false; }
}

// ---- Import / export as JSON ----------------------------------------------
export function exportJson(resume) {
  const blob = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(resume.meta?.name || "resume").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function importJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        resolve({ ...emptyResume(), ...data, theme: { ...emptyResume().theme, ...(data.theme || {}) }, layout: { ...emptyResume().layout, ...(data.layout || {}) }, personal: { ...emptyResume().personal, ...(data.personal || {}) } });
      } catch (e) { reject(new Error("That file isn't valid resume JSON.")); }
    };
    reader.onerror = () => reject(new Error("Couldn't read the file."));
    reader.readAsText(file);
  });
}

// ---- ATS score (heuristic, offline) ---------------------------------------
// A transparent 0-100 score with actionable tips — no network needed. Real
// keyword/grammar analysis (AI) is a planned enhancement; this gives an honest
// baseline that rewards the things ATS parsers and recruiters actually look for.
const ACTION_VERBS = ["led", "built", "shipped", "designed", "improved", "reduced", "increased", "launched", "created", "managed", "developed", "implemented", "optimized", "automated", "delivered", "drove", "owned", "mentored"];
export function atsScore(resume) {
  const tips = [];
  let score = 0;
  const p = resume.personal || {};
  // Contact completeness (20)
  if (p.fullName?.trim()) score += 4; else tips.push("Add your full name.");
  if (p.email?.trim()) score += 5; else tips.push("Add an email address — ATS needs it.");
  if (p.phone?.trim()) score += 4; else tips.push("Add a phone number.");
  if (p.title?.trim()) score += 3; else tips.push("Add a professional title (e.g. \u201cSoftware Engineer\u201d).");
  if (p.location?.trim()) score += 2; else tips.push("Add your city/location.");
  if (p.linkedin?.trim() || p.website?.trim() || p.github?.trim()) score += 2; else tips.push("Add a LinkedIn or portfolio link.");
  // Summary (15)
  const sw = (resume.summary || "").trim().split(/\s+/).filter(Boolean).length;
  if (sw >= 30 && sw <= 90) score += 15; else if (sw > 0) { score += 7; tips.push("Aim for a 30\u201390 word profile summary."); } else tips.push("Write a short profile summary.");
  // Experience (30)
  const exp = resume.experience || [];
  if (exp.length) {
    score += Math.min(10, exp.length * 5);
    const bullets = exp.flatMap((e) => (e.bullets || []).filter((b) => b.trim()));
    if (bullets.length >= 3) score += 8; else tips.push("Add at least 3 bullet points across your experience.");
    const withVerb = bullets.filter((b) => ACTION_VERBS.some((v) => b.toLowerCase().trim().startsWith(v))).length;
    if (bullets.length && withVerb / bullets.length >= 0.5) score += 6; else tips.push("Start bullets with action verbs (Led, Built, Reduced\u2026).");
    const quantified = bullets.filter((b) => /\d/.test(b)).length;
    if (bullets.length && quantified / bullets.length >= 0.4) score += 6; else tips.push("Quantify results with numbers (%, users, time saved).");
  } else tips.push("Add at least one work experience entry.");
  // Skills (15)
  const skills = (resume.skills || []).filter((s) => (s.name || "").trim());
  if (skills.length >= 8) score += 15; else if (skills.length) { score += 8; tips.push("List 8+ relevant skills (many ATS match on keywords)."); } else tips.push("Add a Skills section with role-relevant keywords.");
  // Education (10)
  if ((resume.education || []).some((e) => (e.degree || "").trim())) score += 10; else tips.push("Add your education.");
  // Hygiene (10)
  if (!p.photo) score += 5; else tips.push("Some ATS mis-parse photos \u2014 consider a photo-free template for online applications.");
  const total = Object.values(resume).length; // presence check
  if (total) score += 5;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const band = score >= 80 ? "Strong" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs work";
  return { score, band, tips: tips.slice(0, 8) };
}
