import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { contentService } from "../../services";
import { useSeo } from "../../lib/useSeo";
import { Loading, ErrorState } from "../../components/ui/AsyncState";

// Public SEO landing page for a single subject we actually offer, reached at a
// clean URL like /subjects/accounting. Renders real subject data and links into
// the live quiz player. Non-existent slugs show a friendly "not found".
export default function SubjectLanding() {
  const { slug } = useParams();
  const [subject, setSubject] = useState(null);
  const [streamName, setStreamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setNotFound(false);
    Promise.all([contentService.subjects(), contentService.streams().catch(() => [])])
      .then(([subjects, streams]) => {
        if (!alive) return;
        const s = (Array.isArray(subjects) ? subjects : []).find((x) => x.slug === slug);
        if (!s) { setNotFound(true); return; }
        setSubject(s);
        setStreamName((Array.isArray(streams) ? streams : []).find((x) => x._id === s.stream)?.name || "");
      })
      .catch((e) => alive && setError(e.message || "Could not load this subject."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [slug]);

  useSeo(
    subject ? subject.name : "Subject",
    subject
      ? (subject.description
          ? `${subject.description} Practise ${subject.name} quizzes and mock tests with instant results on My Study Guide.`
          : `Practise ${subject.name} quizzes and full-length mock tests with instant results and detailed solutions on My Study Guide.`)
      : undefined
  );

  if (loading) return <div className="container-page py-12"><Loading label="Loading…" /></div>;
  if (error) return <div className="container-page py-12"><ErrorState message={error} /></div>;
  if (notFound) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-extrabold">Subject not found</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">This subject isn’t available.</p>
        <Link to="/subjects" className="btn-primary mt-5 inline-flex">Browse all subjects <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <nav className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/subjects" className="hover:text-brand-600 dark:hover:text-brand-400">Subjects</Link>
        <span className="px-1.5">/</span>
        <span className="text-slate-700 dark:text-slate-300">{subject.name}</span>
      </nav>

      <h1 className="text-3xl font-extrabold sm:text-4xl">{subject.name}</h1>
      {streamName && <p className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-400">{streamName}</p>}

      <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
        {subject.description
          || `Practise ${subject.name} with subject-wise quizzes and full-length mock tests. Get instant results, detailed step-by-step solutions and track your progress and rank on My Study Guide.`}
      </p>

      {typeof subject.topics === "number" && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4" /> {subject.topics} topic{subject.topics === 1 ? "" : "s"}</span>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/quiz/${subject._id}`} className="btn-primary"><BookOpen className="h-4 w-4" /> Start {subject.name} quizzes <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/test-series" className="btn-outline">Browse test series</Link>
      </div>

      <div className="mt-10">
        <Link to="/subjects" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">← All subjects</Link>
      </div>
    </div>
  );
}
