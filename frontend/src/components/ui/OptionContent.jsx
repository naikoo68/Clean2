import MathText from "./MathText";

// Split a pipe-delimited block (markdown-style table) into rows of trimmed
// cells, dropping the "| --- | --- |" separator rows some models emit.
function parsePipeRows(s) {
  return String(s || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.includes("|"))
    .map((l) => l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim()))
    .filter((cells) => !cells.every((c) => c === "" || /^:?-{2,}:?$/.test(c)));
}

/**
 * Renders a single question OPTION.
 *
 * Journal Entry / Ledger Posting options are supplied as a small
 * Account | Debit | Credit table (pipe-delimited, one row per account line).
 * Rendering them with plain text shows the raw "| ... |" pipes, so here we
 * detect that shape and render a real, aligned table instead. Any other option
 * (plain MCQ, matching sequence, etc.) renders as normal math-aware text.
 */
export default function OptionContent({ children }) {
  const s = typeof children === "string" ? children : "";
  const pipeLines = s.split(/\r?\n/).filter((l) => l.includes("|"));

  // Need at least two pipe rows to be a table (header/separator + data, or two
  // account lines); otherwise treat "|" as ordinary text.
  if (pipeLines.length >= 2) {
    const rows = parsePipeRows(s);
    if (rows.length && rows.some((r) => r.length >= 2)) {
      const looksHeader = /account|particular|debit|credit|amount|dr\.?|cr\.?/i.test(rows[0].join(" "));
      const header = looksHeader ? rows[0] : ["Account", "Debit", "Credit"];
      const body = looksHeader ? rows.slice(1) : rows;
      const cols = Math.max(header.length, ...body.map((r) => r.length), 1);
      const idx = Array.from({ length: cols });
      return (
        <table className="w-full max-w-md border-collapse text-xs">
          <thead>
            <tr>
              {idx.map((_, i) => (
                <th key={i} className="border border-slate-300 px-2 py-1 text-left font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300">
                  {header[i] || ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri}>
                {idx.map((_, ci) => (
                  <td key={ci} className="border border-slate-200 px-2 py-1 align-top dark:border-slate-700">
                    <MathText>{r[ci] || ""}</MathText>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  }
  return <MathText>{children}</MathText>;
}
