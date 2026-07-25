// Universal Visualization Engine — module registry (plugin architecture).
//
// This is the single source of truth for the visualization catalogue. Each
// diagram "type" belongs to a category. A type is either IMPLEMENTED (it has a
// module in MODULES with an `engine`, so the renderer can draw it) or listed in
// the CATALOG as "on the roadmap" (shown in the UI, rendered by a later plugin).
//
// New modules register themselves by adding an entry to MODULES (or, in later
// phases, by calling registerModule at import time for lazy-loaded engines).
// Nothing here removes or depends on existing app code — it's fully additive.

// ---- Categories (the left-hand browser) ----------------------------------
export const CATEGORIES = [
  { id: "charts", label: "Basic Charts" },
  { id: "math", label: "Mathematical Graphs" },
  { id: "statistics", label: "Statistics" },
  { id: "economics", label: "Economics" },
  { id: "finance", label: "Accounting & Finance" },
  { id: "geography", label: "Geography" },
  { id: "biology", label: "Biology" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
  { id: "cs", label: "Computer Science" },
  { id: "business", label: "Business" },
  { id: "education", label: "Education" },
];

// ---- Full catalogue (every diagram the engine aims to support) -----------
// Names shown in the browser. Implemented ones (see MODULES) render now; the
// rest are on the roadmap and slot in as their plugin module ships.
export const CATALOG = {
  charts: [
    "Bar Chart", "Grouped Bar", "Stacked Bar", "Horizontal Bar", "Line Chart", "Spline Chart",
    "Step Chart", "Area Chart", "Stacked Area", "Pie Chart", "Donut Chart", "Scatter Plot",
    "Bubble Chart", "Histogram", "Radar Chart", "Polar Chart", "Box Plot", "Violin Plot",
    "Heatmap", "Treemap", "Sunburst", "Waterfall", "Candlestick", "OHLC", "Gauge", "Funnel",
    "Pyramid", "Pareto", "Lollipop", "Dot Plot", "Timeline", "Calendar Heatmap", "Gantt",
    "Sankey", "Chord Diagram", "Alluvial", "Network Graph", "Force Directed Graph",
  ],
  math: [
    "Cartesian Graph", "Quadratic", "Polynomial", "Exponential", "Logarithmic", "Trigonometric",
    "Hyperbola", "Parametric", "Polar Graph", "Implicit Function", "Derivative", "Integral",
    "Limit", "Taylor Series", "Complex Plane", "3D Surface", "Contour Plot", "Vector Field",
    "Slope Field", "Number Line", "Coordinate Plane",
  ],
  statistics: [
    "Normal Distribution", "Binomial", "Poisson", "Sampling Distribution", "Regression Line",
    "Multiple Regression", "Residual Plot", "QQ Plot", "Stem & Leaf", "Frequency Polygon",
    "Ogive", "Confidence Interval", "ANOVA", "Correlation Matrix", "Scatter Matrix",
  ],
  economics: [
    "Supply & Demand", "Demand Shift", "Supply Shift", "Elasticity", "PPF", "Indifference Curve",
    "Budget Line", "IS-LM", "AD-AS", "Phillips Curve", "Lorenz Curve", "Laffer Curve",
    "Production Function", "Isoquant", "Isocost", "Cost Curves", "Revenue Curves", "Monopoly",
    "Oligopoly", "Game Theory", "Circular Flow", "Business Cycle", "Solow Growth",
    "Comparative Advantage", "Trade Models", "Exchange Rate", "GDP Components", "Money Multiplier",
  ],
  finance: [
    "Balance Sheet", "Income Statement", "Cash Flow", "Ledger", "Journal Flow", "Trial Balance",
    "Break-even Chart", "Financial Ratios", "ROI", "NPV", "IRR", "Portfolio Allocation",
    "Stock Analysis", "Risk Return", "Candlestick", "MACD", "RSI", "Moving Average",
  ],
  geography: [
    "Population Pyramid", "Climate Graph", "Rainfall Graph", "River System", "Drainage Pattern",
    "Topographic Profile", "Contour Diagram", "Map", "Choropleth", "Flow Map", "Elevation",
    "DEM", "Terrain", "Wind Rose",
  ],
  biology: [
    "Cell Structure", "DNA", "RNA", "Mitosis", "Meiosis", "Food Chain", "Food Web", "Human Body",
    "Plant Cell", "Animal Cell", "Ecosystem", "Classification Tree",
  ],
  chemistry: [
    "Bohr Model", "Atomic Structure", "Molecular Structure", "Reaction Diagram",
    "Periodic Table", "Electron Configuration", "Energy Level", "Orbital Diagram",
  ],
  physics: [
    "Free Body Diagram", "Projectile Motion", "Wave", "Circuit Diagram", "Optics", "Ray Diagram",
    "Electric Field", "Magnetic Field", "Energy Diagram",
  ],
  cs: [
    "Flowchart", "Algorithm Flow", "ER Diagram", "DFD", "UML", "Sequence Diagram",
    "Activity Diagram", "Class Diagram", "State Diagram", "Mind Map", "Architecture Diagram",
    "Network Diagram", "API Flow", "Database Schema", "Tree", "Binary Tree", "AVL", "Graph",
    "Linked List", "Queue", "Stack", "Heap", "Trie", "FSM",
  ],
  business: [
    "SWOT", "PESTLE", "BCG Matrix", "Porter's Five Forces", "Value Chain",
    "Business Model Canvas", "Organization Chart", "Decision Tree", "Fishbone", "Kanban",
    "Roadmap", "Customer Journey",
  ],
  education: [
    "Concept Map", "Mind Map", "Flashcards", "Learning Tree", "Process Diagram", "Cause Effect",
    "Comparison Chart", "Cycle Diagram", "Timeline",
  ],
};

// Turn a human name ("Grouped Bar") into a stable type id ("groupedbar").
export const slug = (name) => String(name || "").toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "");

// ---- Implemented modules (Phase 1 — Chart.js engine, no new dependencies) --
// Each entry: { id, label, category, engine, chartType, sample }. `sample` is a
// ready-to-render spec used when the type is picked from the browser.
const bar = (labels, data) => ({ labels, series: [{ name: "Series 1", data }] });

export const MODULES = {
  bar:            { label: "Bar Chart",       category: "charts", engine: "chartjs", chartType: "bar",     sample: { type: "bar", title: "Bar Chart", ...bar(["A", "B", "C", "D"], [12, 19, 8, 15]) } },
  groupedbar:     { label: "Grouped Bar",     category: "charts", engine: "chartjs", chartType: "bar",     sample: { type: "groupedbar", title: "Grouped Bar", labels: ["Q1", "Q2", "Q3"], series: [{ name: "2023", data: [10, 14, 9] }, { name: "2024", data: [13, 11, 16] }] } },
  stackedbar:     { label: "Stacked Bar",     category: "charts", engine: "chartjs", chartType: "bar",     sample: { type: "stackedbar", title: "Stacked Bar", options: { stacked: true }, labels: ["Q1", "Q2", "Q3"], series: [{ name: "Product A", data: [10, 14, 9] }, { name: "Product B", data: [7, 5, 12] }] } },
  horizontalbar:  { label: "Horizontal Bar",  category: "charts", engine: "chartjs", chartType: "bar",     sample: { type: "horizontalbar", title: "Horizontal Bar", options: { horizontal: true }, ...bar(["North", "South", "East", "West"], [22, 17, 9, 14]) } },
  line:           { label: "Line Chart",      category: "charts", engine: "chartjs", chartType: "line",    sample: { type: "line", title: "Line Chart", labels: ["Jan", "Feb", "Mar", "Apr", "May"], series: [{ name: "Users", data: [30, 45, 40, 60, 75] }] } },
  spline:         { label: "Spline Chart",    category: "charts", engine: "chartjs", chartType: "line",    sample: { type: "spline", title: "Spline Chart", options: { smooth: true }, labels: ["Jan", "Feb", "Mar", "Apr", "May"], series: [{ name: "Revenue", data: [30, 45, 40, 60, 75] }] } },
  step:           { label: "Step Chart",      category: "charts", engine: "chartjs", chartType: "line",    sample: { type: "step", title: "Step Chart", options: { stepped: true }, labels: ["Mon", "Tue", "Wed", "Thu"], series: [{ name: "Price", data: [10, 10, 14, 12] }] } },
  area:           { label: "Area Chart",      category: "charts", engine: "chartjs", chartType: "line",    sample: { type: "area", title: "Area Chart", options: { area: true }, labels: ["Jan", "Feb", "Mar", "Apr", "May"], series: [{ name: "Sessions", data: [30, 45, 40, 60, 75] }] } },
  stackedarea:    { label: "Stacked Area",    category: "charts", engine: "chartjs", chartType: "line",    sample: { type: "stackedarea", title: "Stacked Area", options: { area: true, stacked: true }, labels: ["Jan", "Feb", "Mar", "Apr"], series: [{ name: "Desktop", data: [20, 25, 22, 30] }, { name: "Mobile", data: [10, 18, 24, 28] }] } },
  pie:            { label: "Pie Chart",       category: "charts", engine: "chartjs", chartType: "pie",     sample: { type: "pie", title: "Pie Chart", labels: ["Agriculture", "Industry", "Services"], series: [{ name: "GDP", data: [18, 27, 55] }] } },
  donut:          { label: "Donut Chart",     category: "charts", engine: "chartjs", chartType: "doughnut", sample: { type: "donut", title: "Donut Chart", options: { donut: true }, labels: ["Agriculture", "Industry", "Services"], series: [{ name: "GDP", data: [18, 27, 55] }] } },
  scatter:        { label: "Scatter Plot",    category: "charts", engine: "chartjs", chartType: "scatter", sample: { type: "scatter", title: "Scatter Plot", series: [{ name: "Points", data: [{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 4 }, { x: 4, y: 8 }, { x: 5, y: 7 }] }] } },
  bubble:         { label: "Bubble Chart",    category: "charts", engine: "chartjs", chartType: "bubble",  sample: { type: "bubble", title: "Bubble Chart", series: [{ name: "Markets", data: [{ x: 10, y: 20, r: 8 }, { x: 20, y: 30, r: 14 }, { x: 30, y: 15, r: 6 }] }] } },
  radar:          { label: "Radar Chart",     category: "charts", engine: "chartjs", chartType: "radar",   sample: { type: "radar", title: "Radar Chart", labels: ["Speed", "Power", "Range", "Agility", "Defense"], series: [{ name: "Player", data: [65, 59, 80, 81, 56] }] } },
  polar:          { label: "Polar Chart",     category: "charts", engine: "chartjs", chartType: "polarArea", sample: { type: "polar", title: "Polar Area", labels: ["Red", "Green", "Blue", "Yellow"], series: [{ name: "Votes", data: [11, 16, 7, 14] }] } },
  histogram:      { label: "Histogram",       category: "charts", engine: "chartjs", chartType: "bar",     sample: { type: "histogram", title: "Histogram", options: { beginAtZero: true }, labels: ["0-10", "10-20", "20-30", "30-40", "40-50"], series: [{ name: "Frequency", data: [4, 9, 15, 8, 3] }] } },

  // Economics supply/demand rendered as a two-line chart (Phase 1 chart engine).
  supplydemand:   { label: "Supply & Demand", category: "economics", engine: "chartjs", chartType: "line", sample: { type: "supplydemand", title: "Supply & Demand", labels: ["0", "20", "40", "60", "80", "100"], series: [{ name: "Demand", data: [100, 80, 60, 40, 20, 0] }, { name: "Supply", data: [0, 20, 40, 60, 80, 100] }] } },
  gdpcomponents:  { label: "GDP Components",  category: "economics", engine: "chartjs", chartType: "pie",  sample: { type: "gdpcomponents", title: "GDP Components", labels: ["Consumption", "Investment", "Govt", "Net Exports"], series: [{ name: "GDP", data: [60, 18, 20, 2] }] } },
  populationpyramid: { label: "Population Pyramid", category: "geography", engine: "chartjs", chartType: "bar", sample: { type: "populationpyramid", title: "Population Pyramid", options: { horizontal: true, stacked: true }, labels: ["0-14", "15-24", "25-54", "55-64", "65+"], series: [{ name: "Male", data: [-30, -25, -40, -12, -8] }, { name: "Female", data: [28, 24, 41, 13, 10] }] } },
  climategraph:   { label: "Climate Graph",   category: "geography", engine: "chartjs", chartType: "bar",  sample: { type: "climategraph", title: "Climate Graph", labels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], series: [{ name: "Rainfall (mm)", data: [40, 35, 50, 60, 90, 120, 160, 150, 100, 70, 50, 45] }] } },
};

// Chart.js chart types the ChartRenderer knows how to build.
export const CHARTJS_TYPES = new Set(["bar", "line", "pie", "doughnut", "scatter", "bubble", "radar", "polarArea"]);

// Look up an implemented module by a type id (case-insensitive, de-slugged).
export function getModule(typeId) {
  if (!typeId) return null;
  const key = slug(typeId);
  return MODULES[key] || null;
}

// Is this diagram type renderable in the current build?
export const isImplemented = (typeId) => !!getModule(typeId);
