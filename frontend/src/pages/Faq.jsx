import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, GraduationCap, Store, School, ArrowRight } from "lucide-react";
import { useSeo } from "../lib/useSeo";
import { useSettings } from "../context/SettingsContext";
import Breadcrumbs, { breadcrumbLd } from "../components/ui/Breadcrumbs";

// Audience-specific FAQs. Answers are plain, factual descriptions of what each
// audience actually gets and how they get it — sourced from the live plan
// feature lists and sign-up flows (see Pricing.jsx). No fabricated claims,
// prices or numbers; current rates live on the Pricing page. The SAME text is
// rendered on the page and emitted as FAQPage structured data for the active
// tab (Google requires the answer to be visible on the page).

const STUDENT_FAQS = [
  {
    q: "What is My Study Guide?",
    a: "My Study Guide is an online exam-preparation platform. It offers subject-wise quizzes, full-length mock tests and test series, practice questions and study materials, organised by stream, subject and topic, with instant results and performance analytics.",
  },
  {
    q: "Is My Study Guide free to use?",
    a: "You can try selected quizzes and tests for free, and shared public links open without any login. Full access to the complete question bank, test series and analytics is available through a subscription plan, and new users can start a free trial.",
  },
  {
    q: "Do I need an account to attempt a quiz or test?",
    a: "No account is needed to open a shared public quiz or test link, or to try free preview content. Creating a free account lets you track your progress, view analytics and access more content.",
  },
  {
    q: "What subjects and streams are covered?",
    a: "Content is organised by stream, then by subject and topic. You can browse everything currently available from the Streams and Subjects pages.",
  },
  {
    q: "How are results and scores shown?",
    a: "Every quiz and test is scored instantly when you submit. You can review your answers with explanations and see performance analytics that highlight your strong and weak areas.",
  },
  {
    q: "What is the difference between a quiz, practice and a test series?",
    a: "Quizzes are short, topic-wise sets you can attempt quickly. Practice mode lets you work through questions by subject and topic at your own pace. Test series are full-length, timed mock exams that simulate the real exam experience.",
  },
  {
    q: "Can I use My Study Guide on my phone?",
    a: "Yes. The site works on any modern mobile browser and can be installed as an app (PWA) for quick access, so you can practise on the go.",
  },
  {
    q: "How do I subscribe or upgrade?",
    a: "You can view the available plans and subscribe from the Pricing page. Student plans run from monthly up to yearly, and payments are processed securely online.",
  },
  {
    q: "How can I get help or contact support?",
    a: "For any questions or help, use the Contact page to reach the team.",
  },
];

const CREATOR_FAQS = [
  {
    q: "Who is a Creator account for?",
    a: "Creator accounts are for teachers and content creators who want to build and run their own quizzes, test series and study material on My Study Guide and share them with their own students.",
  },
  {
    q: "What do I get with a Creator account?",
    a: "You get your own private My Practice workspace, an AI question generator, tools to build quizzes, test series and previous-year papers, an answer checker with auto-generated notes, document and study-material upload, and performance analytics with progress tracking.",
  },
  {
    q: "How do I get a Creator account?",
    a: "Go to the Creator sign-up page, register and verify your email, then choose a plan. Paid plans activate instantly through secure online payment.",
  },
  {
    q: "Is there a free trial for Creators?",
    a: "Yes. A free trial lets you explore the workspace first. A few features — backing up, restoring and sharing your content with other users — become available once you move to a paid plan.",
  },
  {
    q: "How does Creator pricing work?",
    a: "Creator plans run from monthly up to yearly; longer plans cost less per month and unlock higher AI-generation limits. See the Pricing page for the current rates.",
  },
  {
    q: "Can students use my content without an account?",
    a: "Yes. On a paid plan you can share public links to your quizzes and tests that anyone can open and attempt without logging in.",
  },
  {
    q: "Can I install the workspace as an app?",
    a: "Yes — the My Practice workspace installs as an app (PWA) on your phone or computer for quick access.",
  },
];

const INSTITUTE_FAQS = [
  {
    q: "Who is an Institute account for?",
    a: "Institute accounts are for coaching centres and schools that want to run their own branded exam-preparation platform for their students.",
  },
  {
    q: "What do I get with an Institute account?",
    a: "You get your own branded space and subdomain, your own admin panel to manage everything, students and content that stay fully isolated from other institutes, all the quiz, test-series and study-material tools, the AI question generator, analytics, and room to grow to unlimited students.",
  },
  {
    q: "How do I set up my institute?",
    a: "Sign up on the Institute registration page and choose a plan. Your branded space is provisioned automatically and activates instantly after secure online payment.",
  },
  {
    q: "Is there a free trial for institutes?",
    a: "Yes, a free trial is available so you can set up and evaluate your institute space before subscribing. See the Pricing page for the current trial length.",
  },
  {
    q: "How does institute pricing work?",
    a: "Institutes have their own plans, separate from student and creator plans, running from monthly up to yearly. See the Pricing page for the current rates.",
  },
  {
    q: "Can I use my own branding?",
    a: "Yes. You can set your institute's name, logo and colours, and your students get their own subdomain, so they see your identity throughout.",
  },
];

const GROUPS = {
  student: {
    label: "For Students",
    Icon: GraduationCap,
    intro: "Everything you need to know about quizzes, test series, subjects, results and preparing for your exams with My Study Guide.",
    faqs: STUDENT_FAQS,
    ctas: [
      { label: "Browse quizzes", to: "/quiz", primary: true },
      { label: "See student pricing", to: "/pricing" },
    ],
  },
  creator: {
    label: "For Creators",
    Icon: Store,
    intro: "For teachers and creators — what a Creator account includes and how to start building and sharing your own quizzes, tests and study material.",
    faqs: CREATOR_FAQS,
    ctas: [
      { label: "Become a Creator", to: "/client/register", primary: true },
      { label: "See Creator pricing", to: "/pricing" },
    ],
  },
  institute: {
    label: "For Institutes",
    Icon: School,
    intro: "For coaching institutes and schools — what an Institute account includes and how to launch your own branded platform.",
    faqs: INSTITUTE_FAQS,
    ctas: [
      { label: "Register your institute", to: "/institute/register", primary: true },
      { label: "See Institute pricing", to: "/pricing" },
    ],
  },
};

// Helpful internal links (kept separate from answers so the visible answer text
// matches the FAQPage JSON-LD exactly — better for rich-result eligibility).
const EXPLORE = [
  { label: "Quizzes", to: "/quiz" },
  { label: "Test Series", to: "/test-series" },
  { label: "Practice", to: "/practice" },
  { label: "Study Material", to: "/study" },
  { label: "Streams", to: "/streams" },
  { label: "Subjects", to: "/subjects" },
  { label: "Exams", to: "/exams" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

export default function Faq() {
  const { settings } = useSettings();
  // Creator / Institute audiences are hidden platform-wide when the super-admin
  // turns off publicClientEnabled / publicInstituteEnabled (same rule as the
  // Pricing page), so we never advertise an audience that isn't open.
  const showCreator = settings?.publicClientEnabled !== false;
  const showInstitute = settings?.publicInstituteEnabled !== false;

  const tabs = [
    { key: "student", label: GROUPS.student.label, Icon: GraduationCap },
    ...(showCreator ? [{ key: "creator", label: GROUPS.creator.label, Icon: Store }] : []),
    ...(showInstitute ? [{ key: "institute", label: GROUPS.institute.label, Icon: School }] : []),
  ];

  const [audience, setAudience] = useState("student");
  // Guard against a hidden audience being active (e.g. if toggled off).
  const active = tabs.some((t) => t.key === audience) ? audience : "student";
  const group = GROUPS[active];

  const crumbs = [{ label: "Home", to: "/" }, { label: "FAQ" }];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: group.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      // Reuse the shared breadcrumb builder, nested under @graph (drop its
      // duplicate @context so the whole block is one valid graph).
      (({ "@context": _omit, ...rest }) => rest)(breadcrumbLd(crumbs)),
    ],
  };

  useSeo(
    "Frequently Asked Questions (FAQ)",
    "Answers to common questions about My Study Guide for students, creators and institutes — what each account includes, how to get started, pricing, results and more.",
    undefined,
    jsonLd
  );

  return (
    <div className="container-page py-14">
      <Breadcrumbs items={crumbs} />

      <div className="mx-auto max-w-3xl text-center">
        <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">FAQ</span>
        <h1 className="mt-4 text-4xl font-extrabold">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">{group.intro}</p>
      </div>

      {/* Audience toggle — Students / Creators / Institutes */}
      {tabs.length > 1 && (
        <div className="mx-auto mt-8 flex max-w-md items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setAudience(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition ${
                active === t.key ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <t.Icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        {group.faqs.map((f, i) => (
          <div key={i} className="card p-6">
            <h2 className="flex items-start gap-3 text-lg font-bold text-slate-800 dark:text-slate-100">
              <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
              <span>{f.q}</span>
            </h2>
            <p className="mt-3 pl-8 text-slate-600 dark:text-slate-300">{f.a}</p>
          </div>
        ))}
      </div>

      {/* How to get started — per-audience call to action */}
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap gap-3">
        {group.ctas.map((c) => (
          <Link key={c.to + c.label} to={c.to} className={c.primary ? "btn-primary" : "btn-outline"}>
            {c.label} <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Explore My Study Guide</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {EXPLORE.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
