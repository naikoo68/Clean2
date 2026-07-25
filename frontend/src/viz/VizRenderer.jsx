// Top-level renderer dispatch for the Visualization Engine. Picks the right
// engine for a spec and lazy-loads heavier engines so they never affect the
// main bundle. Forwards the ref through to the active renderer so the Studio can
// export (ChartRenderer ref = Chart.js instance; MermaidRenderer ref = an
// SVG-shaped handle). New engines (Plotly, React Flow, Leaflet, Three.js, …)
// plug in here the same way.
import { forwardRef, Suspense, lazy } from "react";
import ChartRenderer from "./ChartRenderer";
import { getModule } from "./registry";

const MermaidRenderer = lazy(() => import("./MermaidRenderer"));

const EngineLoading = (
  <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-400">
    Loading diagram engine…
  </div>
);

const VizRenderer = forwardRef(function VizRenderer({ spec }, ref) {
  // Engine comes from the registered module; if an AI spec carries Mermaid
  // `code` but no known type, fall back to the Mermaid engine.
  const engine = getModule(spec?.type)?.engine || (spec?.code ? "mermaid" : "chartjs");

  if (engine === "mermaid") {
    return (
      <Suspense fallback={EngineLoading}>
        <MermaidRenderer ref={ref} spec={spec} />
      </Suspense>
    );
  }
  // Default: Chart.js engine (also renders its own "not available yet" notice).
  return <ChartRenderer ref={ref} spec={spec} />;
});

export default VizRenderer;
