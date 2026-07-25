// Organic reaction-mechanism engine — renders real 2D molecular structures from
// SMILES (via OpenChemLib, lazy-loaded from CDN) laid out left-to-right with
// reaction / equilibrium arrows, reagent labels, intermediate brackets, formal
// charges, and optional curved "electron-pushing" arrows.
//
//   spec.chem = {
//     title,
//     steps:   [{ smiles, label, bracket, charge }],   // charge: "+" | "-"
//     arrows:  [{ type:"forward"|"equilibrium", top, bottom }],  // length steps-1
//     electrons: [{ step, from:[fx,fy], to:[fx,fy] }]   // optional, coords 0..1 within a step box
//   }
//
// If OpenChemLib fails to load or a SMILES can't be parsed, the affected species
// gracefully falls back to its text label, so the flow always renders.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const W = 760, H = 520, P0 = "#059669";
const toHref = (svg) => "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

const MechanismRenderer = forwardRef(function MechanismRenderer({ spec }, ref) {
  const holder = useRef(null);
  const chem = spec?.chem || {};
  const steps = Array.isArray(chem.steps) && chem.steps.length ? chem.steps : [{ label: "No steps" }];
  const arrows = Array.isArray(chem.arrows) ? chem.arrows : [];
  const [imgs, setImgs] = useState(() => steps.map(() => null));

  useImperativeHandle(ref, () => ({ engine: "svg", get node() { return holder.current; } }), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mod = await import(/* @vite-ignore */ "https://esm.sh/openchemlib@8");
        const Molecule = mod.Molecule ?? mod.default?.Molecule ?? mod.default;
        const out = steps.map((st) => {
          if (!st?.smiles || !Molecule?.fromSmiles) return null;
          try {
            const m = Molecule.fromSmiles(String(st.smiles));
            const svg = m.toSVG(220, 170, undefined, { suppressChiralText: true, autoCrop: true, autoCropMargin: 8, strokeWidth: 1.4 });
            return { href: toHref(svg) };
          } catch { return null; }
        });
        if (alive) setImgs(out);
      } catch { /* keep text fallback */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(steps)]);

  // ---- layout: single scaled row --------------------------------------------
  const n = steps.length, baseCell = 168, baseGap = 88;
  const need = n * baseCell + (n - 1) * baseGap, maxW = W - 40;
  const sc = need > maxW ? maxW / need : 1;
  const cellW = baseCell * sc, gap = baseGap * sc, cellH = Math.max(96, 150 * sc);
  const totalW = n * cellW + (n - 1) * gap, x0 = (W - totalW) / 2, cy = H / 2;
  const cellX = (i) => x0 + i * (cellW + gap);

  const bracket = (x, y, h, right) => {
    const w = 9;
    return <path d={right ? `M${x - w} ${y} h${w} v${h} h${-w}` : `M${x + w} ${y} h${-w} v${h} h${w}`} fill="none" stroke="currentColor" strokeWidth="2" />;
  };

  return (
    <div ref={holder} className="flex h-full w-full items-center justify-center overflow-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-3xl text-slate-700 dark:text-slate-200" role="img" aria-label={spec?.title || "Reaction mechanism"}>
        <defs>
          <marker id="mech-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="currentColor" /></marker>
          <marker id="mech-eln" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#db2777" /></marker>
        </defs>
        {(spec?.title || chem.title) && <text x={W / 2} y="30" fontSize="15" fontWeight="700" fill="currentColor" textAnchor="middle">{spec?.title || chem.title}</text>}

        {steps.map((st, i) => {
          const x = cellX(i), top = cy - cellH / 2, im = imgs[i];
          return (
            <g key={i}>
              <rect x={x} y={top} width={cellW} height={cellH} rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              {im ? <image href={im.href} x={x + 4} y={top + 4} width={cellW - 8} height={cellH - 8} preserveAspectRatio="xMidYMid meet" />
                : <text x={x + cellW / 2} y={cy + 5} fontSize={Math.max(11, 15 * sc)} fontWeight="600" fill="#334155" textAnchor="middle">{st.label || st.smiles || "?"}</text>}
              {st.bracket && bracket(x - 6, top - 4, cellH + 8, false)}
              {st.bracket && bracket(x + cellW + 6, top - 4, cellH + 8, true)}
              {st.charge && (
                <g>
                  <circle cx={x + cellW - 12} cy={top + 12} r="9" fill="none" stroke={st.charge === "+" ? "#dc2626" : "#2563eb"} strokeWidth="1.5" />
                  <text x={x + cellW - 12} y={top + 16} fontSize="12" fontWeight="800" fill={st.charge === "+" ? "#dc2626" : "#2563eb"} textAnchor="middle">{st.charge}</text>
                </g>
              )}
              {st.label && im && <text x={x + cellW / 2} y={top + cellH + 16} fontSize="11" fontWeight="600" fill="currentColor" textAnchor="middle">{st.label}</text>}
              {/* electron-pushing arrows scoped to this step */}
              {(chem.electrons || []).filter((e) => e.step === i).map((e, k) => {
                const fx = x + (e.from?.[0] ?? 0.3) * cellW, fy = top + (e.from?.[1] ?? 0.3) * cellH;
                const tx = x + (e.to?.[0] ?? 0.7) * cellW, ty = top + (e.to?.[1] ?? 0.5) * cellH;
                const mx = (fx + tx) / 2, my = Math.min(fy, ty) - 26;
                return <path key={k} d={`M${fx} ${fy} Q${mx} ${my} ${tx} ${ty}`} fill="none" stroke="#db2777" strokeWidth="1.8" markerEnd="url(#mech-eln)" />;
              })}
            </g>
          );
        })}

        {arrows.slice(0, n - 1).map((ar, i) => {
          const x1 = cellX(i) + cellW + 6, x2 = cellX(i + 1) - 6, mxx = (x1 + x2) / 2;
          const equil = ar?.type === "equilibrium";
          return (
            <g key={i}>
              {equil ? (
                <g stroke="currentColor" strokeWidth="1.8" fill="none">
                  <line x1={x1} y1={cy - 4} x2={x2} y2={cy - 4} markerEnd="url(#mech-arrow)" />
                  <line x1={x2} y1={cy + 4} x2={x1} y2={cy + 4} markerEnd="url(#mech-arrow)" />
                </g>
              ) : (
                <line x1={x1} y1={cy} x2={x2} y2={cy} stroke="currentColor" strokeWidth="2" markerEnd="url(#mech-arrow)" />
              )}
              {ar?.top && <text x={mxx} y={cy - 12} fontSize="11" fontWeight="600" fill={P0} textAnchor="middle">{ar.top}</text>}
              {ar?.bottom && <text x={mxx} y={cy + 20} fontSize="10" fill="#64748b" textAnchor="middle">{ar.bottom}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default MechanismRenderer;
