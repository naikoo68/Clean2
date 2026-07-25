// Mermaid engine for the Visualization Engine — renders text-defined diagrams
// (flowcharts, mind maps, UML/class, sequence, state, ER, gantt, journey, …)
// from `spec.code`. Mermaid is loaded LAZILY (dynamic import) so it's only
// fetched when a diagram of this engine is actually shown — it never bloats the
// main bundle or affects existing pages.
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useTheme } from "../context/ThemeContext";

const MermaidRenderer = forwardRef(function MermaidRenderer({ spec }, ref) {
  const holder = useRef(null);
  const [error, setError] = useState("");
  const { theme } = useTheme();

  // Expose an SVG-shaped handle so the Studio's exporters know how to save it.
  useImperativeHandle(ref, () => ({ engine: "svg", node: holder.current }), []);

  useEffect(() => {
    let cancelled = false;
    const code = String(spec?.code || "").trim();
    if (!code) { setError(""); if (holder.current) holder.current.innerHTML = ""; return; }

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "inherit",
        });
        const id = "mmd-" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && holder.current) {
          holder.current.innerHTML = svg;
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Couldn't render this diagram — check the Mermaid code.");
      }
    })();

    return () => { cancelled = true; };
  }, [spec?.code, theme]);

  return (
    <div className="flex h-full w-full flex-col">
      <div
        ref={holder}
        className="mermaid-holder flex flex-1 items-center justify-center overflow-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      />
      {error && (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
});

export default MermaidRenderer;
