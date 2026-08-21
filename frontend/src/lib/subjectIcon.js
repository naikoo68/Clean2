// Map a subject NAME to a sensible lucide icon name, so each subject shows a
// relevant logo automatically (used when no custom icon/image is set).
//
// Only widely-available lucide icon names are used. The caller looks the name up
// as `Icons[name]` and falls back to BookOpen if a build doesn't include it, so
// an unknown name can never crash the page.
const RULES = [
  [/account|ledger|book.?keep|commerce|audit|tally/i, "Calculator"],
  [/econom|micro|macro|trade|market|finance|bank|gdp/i, "TrendingUp"],
  [/business|management|\bmba\b|marketing|entrepreneur/i, "Briefcase"],
  [/biolog|botany|zoolog|life scien|anatomy|physiolog|genetic|cell/i, "Dna"],
  [/chem/i, "FlaskConical"],
  [/physic/i, "Atom"],
  [/math|algebra|geometry|calculus|arithmetic|quant|numerical|mensuration/i, "Sigma"],
  [/reasoning|aptitude|logic/i, "Brain"],
  [/comput|coding|program|software|\bit\b|informatics|data structure|cyber/i, "Cpu"],
  [/environment|ecolog|pollution|nature|biodiversity/i, "Leaf"],
  [/current affairs|general knowledge|\bgk\b|news|awareness/i, "Newspaper"],
  [/english|grammar|vocab|literature|verbal|comprehension/i, "Languages"],
  [/hindi|urdu|sanskrit|kashmiri|dogri|punjabi|arabic|persian|language/i, "Languages"],
  [/histor|ancient|medieval|civilization|freedom|dynasty|heritage/i, "Landmark"],
  [/geograph|\bmap\b|earth|physiograph|climate|river|terrain/i, "Globe"],
  [/polit|civics|constitution|governance|polity|law|legal|\bact\b/i, "Scale"],
  [/nursing|medical|health|pharma|disease|clinical/i, "Stethoscope"],
  [/psycholog/i, "Brain"],
  [/general scien|\bscience\b|ncert/i, "FlaskConical"],
  [/exam|paper|mock|previous year|\bpyq\b|\b20\d\d\b/i, "GraduationCap"],
];

export function subjectIconName(name) {
  const n = String(name || "");
  for (const [re, icon] of RULES) if (re.test(n)) return icon;
  return "BookOpen";
}
