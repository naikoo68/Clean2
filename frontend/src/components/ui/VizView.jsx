// Renders a question's diagram (`q.viz`) using the app's Visualization Engine —
// the same JSON-spec renderer as the Visualization Studio (Chart.js / Mermaid /
// Plotly / graphs / SVG families). Used by "diagram" questions, whose stem asks
// about the figure drawn here. Returns null when there's no usable spec, so it's
// safe to drop in beside GraphView anywhere a question is shown.
import { Suspense, lazy } from "react";

// VizRenderer pulls in Chart.js eagerly and lazy-loads heavier engines; lazy-
// load the whole renderer so a question list without diagrams stays light.
const VizRenderer = lazy(() => import("../../viz/VizRenderer"));

// A spec is renderable when it's an object carrying a type + some payload.
function hasSpec(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  if (!String(v.type || "").trim() && !v.code) return false;
  return (
    (Array.isArray(v.series) && v.series.length > 0) ||
    (Array.isArray(v.labels) && v.labels.length > 0) ||
    (typeof v.code === "string" && v.code.trim() !== "") ||
    !!v.plotly || !!v.graph || !!v.network || !!v.framework ||
    !!v.map || !!v.science || !!v.illustration || !!v.chem
  );
}

export default function VizView({ q }) {
  const spec = q?.viz;
  if (!hasSpec(spec)) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
      {spec.title && (
        <p className="mb-1 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">{spec.title}</p>
      )}
      <div className="mx-auto h-[300px] w-full max-w-xl">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading diagram…</div>}>
          <VizRenderer spec={spec} />
        </Suspense>
      </div>
    </div>
  );
}
