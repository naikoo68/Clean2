import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useSeo } from "../lib/useSeo";
import Breadcrumbs, { breadcrumbLd } from "../components/ui/Breadcrumbs";

// Frequently asked questions. Answers are plain, factual descriptions of what
// the platform actually does — no fabricated claims, prices or numbers. The
// SAME text is rendered on the page and emitted as FAQPage structured data
// (Google requires the answer to be visible on the page), so this page is
// eligible for FAQ rich results without any keyword stuffing.
const FAQS = [
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
    q: "How do I get the most out of the platform?",
    a: "Follow the hierarchy: pick your stream, choose a subject, drill into a topic, then attempt its quizzes and tests. Review the explanations after each attempt and use the analytics to focus your revision.",
  },
  {
    q: "How do I subscribe or upgrade?",
    a: "You can view the available plans and subscribe from the Pricing page. Payments are processed securely online.",
  },
  {
    q: "How can I get help or contact support?",
    a: "For any questions or help, use the Contact page to reach the team.",
  },
];

// Helpful internal links (kept separate from answers so the visible answer text
// matches the FAQPage JSON-LD exactly — better for rich-result eligibility).
const EXPLORE = [
  { label: "Quizzes", to: "/quiz" },
  { label: "Test Series", to: "/test-series" },
  { label: "Practice", to: "/practice" },
  { label: "Study Material", to: "/study" },
  { label: "Streams", to: "/streams" },
  { label: "Subjects", to: "/subjects" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

export default function Faq() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "FAQ" }];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
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
    "Answers to common questions about My Study Guide — quizzes, mock tests, test series, subjects, free trial, results, analytics and how to prepare for your exams.",
    undefined,
    jsonLd
  );

  return (
    <div className="container-page py-14">
      <Breadcrumbs items={crumbs} />

      <div className="mx-auto max-w-3xl text-center">
        <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">FAQ</span>
        <h1 className="mt-4 text-4xl font-extrabold">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Everything you need to know about quizzes, test series, subjects, results and
          preparing for your exams with My Study Guide.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {FAQS.map((f, i) => (
          <div key={i} className="card p-6">
            <h2 className="flex items-start gap-3 text-lg font-bold text-slate-800 dark:text-slate-100">
              <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" />
              <span>{f.q}</span>
            </h2>
            <p className="mt-3 pl-8 text-slate-600 dark:text-slate-300">{f.a}</p>
          </div>
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
