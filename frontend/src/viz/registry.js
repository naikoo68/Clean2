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

  // ---- Mermaid engine (text-defined diagrams) — lazy-loaded, no bundle cost ----
  flowchart:       { label: "Flowchart",         category: "cs",        engine: "mermaid", sample: { type: "flowchart", title: "Flowchart", code: "flowchart TD\n  A[Start] --> B{Decision?}\n  B -->|Yes| C[Do this]\n  B -->|No| D[Do that]\n  C --> E[End]\n  D --> E" } },
  algorithmflow:   { label: "Algorithm Flow",    category: "cs",        engine: "mermaid", sample: { type: "algorithmflow", title: "Algorithm Flow", code: "flowchart TD\n  A([Start]) --> B[/Read input/]\n  B --> C{n > 0?}\n  C -->|Yes| D[Process]\n  D --> C\n  C -->|No| E([End])" } },
  activitydiagram: { label: "Activity Diagram",  category: "cs",        engine: "mermaid", sample: { type: "activitydiagram", title: "Activity Diagram", code: "flowchart TD\n  Start --> Login\n  Login --> Valid{Valid?}\n  Valid -->|Yes| Dashboard\n  Valid -->|No| Login\n  Dashboard --> Logout --> Stop([End])" } },
  processdiagram:  { label: "Process Diagram",   category: "education", engine: "mermaid", sample: { type: "processdiagram", title: "Process Diagram", code: "flowchart LR\n  A[Plan] --> B[Do] --> C[Check] --> D[Act] --> A" } },
  mindmap:         { label: "Mind Map",          category: "education", engine: "mermaid", sample: { type: "mindmap", title: "Mind Map", code: "mindmap\n  root((Main Topic))\n    Subtopic 1\n      Idea A\n      Idea B\n    Subtopic 2\n      Idea C\n    Subtopic 3" } },
  conceptmap:      { label: "Concept Map",       category: "education", engine: "mermaid", sample: { type: "conceptmap", title: "Concept Map", code: "mindmap\n  root((Concept))\n    Definition\n    Examples\n    Related ideas\n    Applications" } },
  learningtree:    { label: "Learning Tree",     category: "education", engine: "mermaid", sample: { type: "learningtree", title: "Learning Tree", code: "flowchart TD\n  Topic --> A[Prerequisite 1]\n  Topic --> B[Prerequisite 2]\n  A --> C[Advanced Skill]\n  B --> C" } },
  sequencediagram: { label: "Sequence Diagram",  category: "cs",        engine: "mermaid", sample: { type: "sequencediagram", title: "Sequence Diagram", code: "sequenceDiagram\n  participant U as User\n  participant S as Server\n  U->>S: Request\n  S-->>U: Response" } },
  classdiagram:    { label: "Class Diagram",     category: "cs",        engine: "mermaid", sample: { type: "classdiagram", title: "Class Diagram", code: "classDiagram\n  class Animal {\n    +String name\n    +int age\n    +makeSound()\n  }\n  Animal <|-- Dog\n  Animal <|-- Cat" } },
  uml:             { label: "UML",               category: "cs",        engine: "mermaid", sample: { type: "uml", title: "UML Class Diagram", code: "classDiagram\n  class Account {\n    +String id\n    +deposit()\n    +withdraw()\n  }\n  Account <|-- Savings\n  Account <|-- Current" } },
  statediagram:    { label: "State Diagram",     category: "cs",        engine: "mermaid", sample: { type: "statediagram", title: "State Diagram", code: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Running : start\n  Running --> Idle : stop\n  Running --> [*]" } },
  erdiagram:       { label: "ER Diagram",        category: "cs",        engine: "mermaid", sample: { type: "erdiagram", title: "ER Diagram", code: "erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE_ITEM : contains\n  CUSTOMER {\n    string name\n    string email\n  }" } },
  gantt:           { label: "Gantt",             category: "charts",    engine: "mermaid", sample: { type: "gantt", title: "Gantt Chart", code: "gantt\n  title Project Plan\n  dateFormat YYYY-MM-DD\n  section Phase 1\n  Research :a1, 2024-01-01, 20d\n  Design   :after a1, 15d\n  section Phase 2\n  Build    :2024-02-15, 30d" } },
  timeline:        { label: "Timeline",          category: "charts",    engine: "mermaid", sample: { type: "timeline", title: "Timeline", code: "timeline\n  title History\n  2001 : Founded\n  2010 : Expanded\n  2020 : Went global" } },
  customerjourney: { label: "Customer Journey",  category: "business",  engine: "mermaid", sample: { type: "customerjourney", title: "Customer Journey", code: "journey\n  title Customer Journey\n  section Discover\n    Visit site: 3: Customer\n    Read reviews: 4: Customer\n  section Buy\n    Add to cart: 5: Customer\n    Checkout: 3: Customer" } },
};

// ---- Phase 3: math / statistics / economics / finance (Chart.js engine) ----
// A function, distribution, or economics curve is just a line/scatter/bar chart
// with computed points — so these render on the SAME verified Chart.js engine,
// no new dependency. The samples give a real starting graph; the AI computes
// fresh data for any prompt. Multiple curves = multiple series.
const _range = (a, b, step = 1) => { const r = []; for (let x = a; x <= b + 1e-9; x += step) r.push(Math.round(x * 100) / 100); return r; };
const _line = (type, label, category, labels, series, options = {}) => ({ label, category, engine: "chartjs", chartType: "line", sample: { type, title: label, labels, series, options: { smooth: true, ...options } } });
const _scatter = (type, label, category, series, options = {}) => ({ label, category, engine: "chartjs", chartType: "scatter", sample: { type, title: label, series, options } });
const _bar = (type, label, category, labels, series, options = {}) => ({ label, category, engine: "chartjs", chartType: "bar", sample: { type, title: label, labels, series, options } });
const _pie = (type, label, category, labels, data) => ({ label, category, engine: "chartjs", chartType: "pie", sample: { type, title: label, labels, series: [{ name: label, data }] } });
const _X = _range(-5, 5);
const _Q = _range(0, 100, 20);
const _sin = (deg) => Math.round(Math.sin((deg * Math.PI) / 180) * 100) / 100;
const _cos = (deg) => Math.round(Math.cos((deg * Math.PI) / 180) * 100) / 100;

Object.assign(MODULES, {
  // Mathematics
  quadratic:      _line("quadratic", "Quadratic (y=x²)", "math", _X, [{ name: "y = x²", data: _X.map((x) => x * x) }], { beginAtZero: false }),
  polynomial:     _line("polynomial", "Polynomial", "math", _X, [{ name: "y = x³−3x", data: _X.map((x) => x ** 3 - 3 * x) }], { beginAtZero: false }),
  exponential:    _line("exponential", "Exponential (y=2ˣ)", "math", _range(-3, 5, 0.5), [{ name: "y = 2^x", data: _range(-3, 5, 0.5).map((x) => Math.round(Math.pow(2, x) * 100) / 100) }]),
  logarithmic:    _line("logarithmic", "Logarithmic (y=ln x)", "math", _range(0.2, 8, 0.4), [{ name: "y = ln x", data: _range(0.2, 8, 0.4).map((x) => Math.round(Math.log(x) * 100) / 100) }], { beginAtZero: false }),
  trigonometric:  _line("trigonometric", "Sine & Cosine", "math", _range(0, 360, 30), [{ name: "sin", data: _range(0, 360, 30).map(_sin) }, { name: "cos", data: _range(0, 360, 30).map(_cos) }], { beginAtZero: false }),
  derivative:     _line("derivative", "Function & Derivative", "math", _X, [{ name: "f(x)=x²", data: _X.map((x) => x * x) }, { name: "f'(x)=2x", data: _X.map((x) => 2 * x) }], { beginAtZero: false }),
  integral:       _line("integral", "Function & Integral", "math", _X, [{ name: "f(x)=x", data: _X.map((x) => x) }, { name: "∫f = x²/2", data: _X.map((x) => Math.round((x * x) / 2 * 100) / 100) }], { beginAtZero: false }),
  parametric:     _scatter("parametric", "Parametric (circle)", "math", [{ name: "x=cos t, y=sin t", data: _range(0, 360, 15).map((d) => ({ x: _cos(d), y: _sin(d) })), line: true }]),

  // Statistics
  normaldistribution: _line("normaldistribution", "Normal Distribution", "statistics", _range(-4, 4, 0.5), [{ name: "f(x)", data: _range(-4, 4, 0.5).map((x) => Math.round((Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI)) * 1000) / 1000) }], { beginAtZero: true }),
  binomial:       _bar("binomial", "Binomial Distribution", "statistics", ["0", "1", "2", "3", "4", "5", "6"], [{ name: "P(X)", data: [1, 6, 15, 20, 15, 6, 1].map((v) => Math.round((v / 64) * 1000) / 1000) }]),
  poisson:        _bar("poisson", "Poisson Distribution", "statistics", ["0", "1", "2", "3", "4", "5", "6"], [{ name: "P(X)", data: [0.05, 0.15, 0.22, 0.22, 0.17, 0.1, 0.05] }]),
  regressionline: _scatter("regressionline", "Regression Line", "statistics", [{ name: "Data", data: [{ x: 1, y: 2 }, { x: 2, y: 2.8 }, { x: 3, y: 3.6 }, { x: 4, y: 5 }, { x: 5, y: 5.5 }] }, { name: "Trend", data: [{ x: 1, y: 2 }, { x: 5, y: 5.6 }], line: true }]),
  residualplot:   _scatter("residualplot", "Residual Plot", "statistics", [{ name: "Residuals", data: [{ x: 1, y: 0.2 }, { x: 2, y: -0.3 }, { x: 3, y: 0.1 }, { x: 4, y: 0.4 }, { x: 5, y: -0.2 }] }]),
  frequencypolygon: _line("frequencypolygon", "Frequency Polygon", "statistics", ["10", "20", "30", "40", "50"], [{ name: "Frequency", data: [4, 9, 15, 8, 3] }], { smooth: false }),
  ogive:          _line("ogive", "Ogive (Cumulative)", "statistics", ["10", "20", "30", "40", "50"], [{ name: "Cumulative f", data: [4, 13, 28, 36, 39] }], { smooth: false }),
  confidenceinterval: _bar("confidenceinterval", "Confidence Interval", "statistics", ["A", "B", "C", "D"], [{ name: "Mean", data: [50, 62, 45, 58] }]),

  // Economics
  demandshift:    _line("demandshift", "Demand Shift", "economics", _Q, [{ name: "D₁", data: [100, 80, 60, 40, 30, 20] }, { name: "D₂ (shift)", data: [120, 100, 80, 60, 50, 40] }, { name: "Supply", data: [0, 20, 40, 60, 80, 100] }], { beginAtZero: true, smooth: false }),
  supplyshift:    _line("supplyshift", "Supply Shift", "economics", _Q, [{ name: "Demand", data: [100, 80, 60, 40, 20, 0] }, { name: "S₁", data: [0, 20, 40, 60, 80, 100] }, { name: "S₂ (shift)", data: [20, 40, 60, 80, 100, 120] }], { beginAtZero: true, smooth: false }),
  elasticity:     _line("elasticity", "Elasticity of Demand", "economics", _Q, [{ name: "Elastic", data: [100, 70, 45, 25, 10, 0] }, { name: "Inelastic", data: [100, 92, 82, 70, 55, 35] }], { beginAtZero: true, smooth: false }),
  ppf:            _line("ppf", "Production Possibility Frontier", "economics", _range(0, 100, 20), [{ name: "PPF", data: [100, 96, 88, 74, 50, 0] }], { beginAtZero: true }),
  indifferencecurve: _line("indifferencecurve", "Indifference Curve", "economics", _range(1, 10, 1), [{ name: "IC", data: _range(1, 10, 1).map((x) => Math.round(40 / x)) }], { beginAtZero: true }),
  budgetline:     _line("budgetline", "Budget Line", "economics", _range(0, 10, 2), [{ name: "Budget", data: [10, 8, 6, 4, 2, 0] }], { beginAtZero: true, smooth: false }),
  islm:           _line("islm", "IS-LM", "economics", _range(0, 100, 20), [{ name: "IS", data: [80, 64, 48, 32, 16, 0] }, { name: "LM", data: [0, 16, 32, 48, 64, 80] }], { beginAtZero: true, smooth: false }),
  adas:           _line("adas", "AD-AS", "economics", _range(0, 100, 20), [{ name: "AD", data: [100, 80, 60, 40, 20, 0] }, { name: "AS", data: [0, 20, 40, 60, 80, 100] }], { beginAtZero: true, smooth: false }),
  phillipscurve:  _line("phillipscurve", "Phillips Curve", "economics", _range(1, 10, 1), [{ name: "Inflation", data: _range(1, 10, 1).map((u) => Math.round((100 / u)) / 10) }], { beginAtZero: true }),
  laffercurve:    _line("laffercurve", "Laffer Curve", "economics", _range(0, 100, 10), [{ name: "Revenue", data: _range(0, 100, 10).map((t) => Math.round((t * (100 - t)) / 25)) }], { beginAtZero: true }),
  lorenzcurve:    _line("lorenzcurve", "Lorenz Curve", "economics", _range(0, 100, 20), [{ name: "Equality", data: [0, 20, 40, 60, 80, 100] }, { name: "Lorenz", data: [0, 5, 15, 35, 60, 100] }], { beginAtZero: true, smooth: false }),
  costcurves:     _line("costcurves", "Cost Curves", "economics", _range(1, 10, 1), [{ name: "ATC", data: [50, 30, 23, 20, 19, 20, 22, 25, 29, 34] }, { name: "MC", data: [5, 6, 7, 9, 11, 13, 16, 20, 24, 28] }], { beginAtZero: true }),
  revenuecurves:  _line("revenuecurves", "Revenue Curves", "economics", _range(1, 10, 1), [{ name: "AR", data: _range(1, 10, 1).map((q) => Math.max(0, 20 - 2 * q)) }, { name: "MR", data: _range(1, 10, 1).map((q) => 20 - 4 * q) }], { beginAtZero: false }),
  gdpcomponentsbar: _bar("gdpcomponentsbar", "GDP Components (bar)", "economics", ["C", "I", "G", "NX"], [{ name: "% of GDP", data: [60, 18, 20, 2] }]),

  // Accounting & Finance
  breakevenchart: _line("breakevenchart", "Break-even Chart", "finance", _range(0, 100, 20), [{ name: "Revenue", data: [0, 40, 80, 120, 160, 200] }, { name: "Total Cost", data: [50, 70, 90, 110, 130, 150] }], { beginAtZero: true, smooth: false }),
  roi:            _bar("roi", "ROI by Project", "finance", ["A", "B", "C", "D"], [{ name: "ROI %", data: [12, 18, 9, 22] }]),
  riskreturn:     _scatter("riskreturn", "Risk vs Return", "finance", [{ name: "Assets", data: [{ x: 5, y: 4 }, { x: 10, y: 7 }, { x: 15, y: 11 }, { x: 20, y: 13 }] }]),
  movingaverage:  _line("movingaverage", "Moving Average", "finance", ["1", "2", "3", "4", "5", "6", "7", "8"], [{ name: "Price", data: [10, 12, 11, 14, 13, 16, 15, 18] }, { name: "MA(3)", data: [null, null, 11, 12.3, 12.7, 14.3, 14.7, 16.3] }], { smooth: false }),
  portfolioallocation: _pie("portfolioallocation", "Portfolio Allocation", "finance", ["Stocks", "Bonds", "Cash", "Real Estate"], [50, 25, 10, 15]),
  financialratios: _bar("financialratios", "Financial Ratios", "finance", ["Current", "Quick", "Debt/Equity", "ROE"], [{ name: "Ratio", data: [1.8, 1.2, 0.6, 0.15] }]),

  // Extra chart shapes on the Chart.js engine
  pyramid:        _bar("pyramid", "Pyramid", "charts", ["Level 4", "Level 3", "Level 2", "Level 1"], [{ name: "Value", data: [10, 25, 45, 70] }], { horizontal: true }),
  lollipop:       _bar("lollipop", "Lollipop (bar)", "charts", ["A", "B", "C", "D", "E"], [{ name: "Value", data: [8, 15, 12, 20, 6] }]),
  dotplot:        _scatter("dotplot", "Dot Plot", "charts", [{ name: "Values", data: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 1 }] }]),
});

// ---- Phase 4: Plotly engine (advanced scientific / statistical charts) ------
// These carry a ready Plotly figure in `sample.plotly = { data, layout }`.
// Plotly is CDN-lazy-loaded (see PlotlyRenderer) — no dependency, no bundle cost.
const _plotly = (type, label, category, data, layout = {}) => ({ label, category, engine: "plotly", sample: { type, title: label, plotly: { data, layout } } });

Object.assign(MODULES, {
  heatmap:        _plotly("heatmap", "Heatmap", "charts", [{ z: [[1, 20, 30], [20, 1, 60], [30, 60, 1]], x: ["A", "B", "C"], y: ["X", "Y", "Z"], type: "heatmap", colorscale: "Blues" }]),
  boxplot:        _plotly("boxplot", "Box Plot", "charts", [{ y: [1, 2, 2, 3, 4, 4, 4, 5, 7, 9], type: "box", name: "Sample" }]),
  violinplot:     _plotly("violinplot", "Violin Plot", "charts", [{ y: [1, 2, 2, 3, 4, 4, 4, 5, 7, 9], type: "violin", box: { visible: true }, meanline: { visible: true }, name: "Sample" }]),
  sankey:         _plotly("sankey", "Sankey Diagram", "charts", [{ type: "sankey", orientation: "h", node: { label: ["Coal", "Gas", "Electricity", "Homes", "Industry"], pad: 15, thickness: 16 }, link: { source: [0, 1, 2, 2], target: [2, 2, 3, 4], value: [8, 4, 7, 5] } }]),
  treemap:        _plotly("treemap", "Treemap", "charts", [{ type: "treemap", labels: ["Total", "A", "B", "A1", "A2", "B1"], parents: ["", "Total", "Total", "A", "A", "B"], values: [0, 6, 4, 3, 3, 4] }]),
  sunburst:       _plotly("sunburst", "Sunburst", "charts", [{ type: "sunburst", labels: ["Total", "A", "B", "A1", "A2", "B1"], parents: ["", "Total", "Total", "A", "A", "B"], values: [0, 6, 4, 3, 3, 4], branchvalues: "total" }]),
  candlestick:    _plotly("candlestick", "Candlestick", "charts", [{ type: "candlestick", x: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: [10, 12, 11, 13, 12], high: [12, 14, 13, 15, 14], low: [9, 11, 10, 12, 11], close: [11, 13, 12, 14, 13] }]),
  ohlc:           _plotly("ohlc", "OHLC", "charts", [{ type: "ohlc", x: ["Mon", "Tue", "Wed", "Thu", "Fri"], open: [10, 12, 11, 13, 12], high: [12, 14, 13, 15, 14], low: [9, 11, 10, 12, 11], close: [11, 13, 12, 14, 13] }]),
  gauge:          _plotly("gauge", "Gauge", "charts", [{ type: "indicator", mode: "gauge+number", value: 68, gauge: { axis: { range: [0, 100] }, bar: { color: "#2563eb" } } }]),
  funnel:         _plotly("funnel", "Funnel", "charts", [{ type: "funnel", y: ["Visits", "Sign-ups", "Trials", "Paid"], x: [1000, 600, 300, 120] }]),
  waterfall:      _plotly("waterfall", "Waterfall", "charts", [{ type: "waterfall", x: ["Start", "Q1", "Q2", "Q3", "Total"], measure: ["absolute", "relative", "relative", "relative", "total"], y: [100, 20, -30, 40, 0] }]),
  "3dsurface":    _plotly("3dsurface", "3D Surface", "math", [{ type: "surface", z: [[1, 2, 3, 2], [2, 4, 5, 3], [3, 5, 7, 4], [2, 3, 4, 2]] }]),
  contourplot:    _plotly("contourplot", "Contour Plot", "math", [{ type: "contour", z: [[1, 2, 3, 2], [2, 4, 5, 3], [3, 5, 7, 4], [2, 3, 4, 2]], colorscale: "Viridis" }]),
  correlationmatrix: _plotly("correlationmatrix", "Correlation Matrix", "statistics", [{ z: [[1, 0.8, -0.3], [0.8, 1, -0.1], [-0.3, -0.1, 1]], x: ["A", "B", "C"], y: ["A", "B", "C"], type: "heatmap", colorscale: "RdBu", zmin: -1, zmax: 1 }]),
  scattermatrix:  _plotly("scattermatrix", "Scatter Matrix", "statistics", [{ type: "splom", dimensions: [{ label: "A", values: [1, 2, 3, 4, 5] }, { label: "B", values: [5, 3, 4, 2, 1] }, { label: "C", values: [2, 4, 1, 5, 3] }] }]),
});

// ---- Phase 5: graph / network / tree / data structures (Cytoscape engine) ---
// Carry `sample.graph = { nodes, edges, layout, directed }`. Cytoscape is
// CDN-lazy-loaded (see GraphRenderer). Layouts: breadthfirst (trees/hierarchy),
// cose (force-directed networks), grid, circle, concentric.
const _graph = (type, label, category, nodes, edges, layout = "breadthfirst", directed = true) => ({ label, category, engine: "cytoscape", sample: { type, title: label, graph: { nodes, edges, layout, directed } } });
const _chain = (ids) => ids.map((id, i) => (i ? { source: ids[i - 1], target: id } : null)).filter(Boolean);

Object.assign(MODULES, {
  networkgraph:      _graph("networkgraph", "Network Graph", "cs", [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "E" }], [{ source: "A", target: "B" }, { source: "A", target: "C" }, { source: "B", target: "D" }, { source: "C", target: "D" }, { source: "D", target: "E" }, { source: "E", target: "A" }], "cose", false),
  forcedirectedgraph:_graph("forcedirectedgraph", "Force-Directed Graph", "charts", [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }, { id: "6" }], [{ source: "1", target: "2" }, { source: "1", target: "3" }, { source: "2", target: "4" }, { source: "3", target: "5" }, { source: "4", target: "6" }, { source: "5", target: "6" }, { source: "2", target: "5" }], "cose", false),
  graph:             _graph("graph", "Graph", "cs", [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }], [{ source: "A", target: "B" }, { source: "B", target: "C" }, { source: "C", target: "D" }, { source: "D", target: "A" }, { source: "A", target: "C" }], "circle", false),
  tree:              _graph("tree", "Tree", "cs", [{ id: "Root" }, { id: "A" }, { id: "B" }, { id: "C" }, { id: "A1" }, { id: "A2" }, { id: "B1" }], [{ source: "Root", target: "A" }, { source: "Root", target: "B" }, { source: "Root", target: "C" }, { source: "A", target: "A1" }, { source: "A", target: "A2" }, { source: "B", target: "B1" }]),
  binarytree:        _graph("binarytree", "Binary Tree", "cs", [{ id: "8" }, { id: "3" }, { id: "10" }, { id: "1" }, { id: "6" }, { id: "14" }], [{ source: "8", target: "3" }, { source: "8", target: "10" }, { source: "3", target: "1" }, { source: "3", target: "6" }, { source: "10", target: "14" }]),
  avl:               _graph("avl", "AVL Tree", "cs", [{ id: "30" }, { id: "20" }, { id: "40" }, { id: "10" }, { id: "25" }, { id: "50" }], [{ source: "30", target: "20" }, { source: "30", target: "40" }, { source: "20", target: "10" }, { source: "20", target: "25" }, { source: "40", target: "50" }]),
  heap:              _graph("heap", "Heap", "cs", [{ id: "1" }, { id: "3" }, { id: "6" }, { id: "5" }, { id: "9" }, { id: "8" }], [{ source: "1", target: "3" }, { source: "1", target: "6" }, { source: "3", target: "5" }, { source: "3", target: "9" }, { source: "6", target: "8" }]),
  trie:              _graph("trie", "Trie", "cs", [{ id: "root", label: "•" }, { id: "c", label: "c" }, { id: "a", label: "a" }, { id: "t", label: "t" }, { id: "r", label: "r" }], [{ source: "root", target: "c" }, { source: "c", target: "a" }, { source: "a", target: "t" }, { source: "a", target: "r" }]),
  linkedlist:        _graph("linkedlist", "Linked List", "cs", [{ id: "10" }, { id: "20" }, { id: "30" }, { id: "40" }], _chain(["10", "20", "30", "40"]), "grid"),
  queue:             _graph("queue", "Queue (FIFO)", "cs", [{ id: "front" }, { id: "a" }, { id: "b" }, { id: "c" }, { id: "rear" }], _chain(["front", "a", "b", "c", "rear"]), "grid"),
  stack:             _graph("stack", "Stack (LIFO)", "cs", [{ id: "top" }, { id: "x" }, { id: "y" }, { id: "z", label: "bottom" }], _chain(["top", "x", "y", "z"]), "breadthfirst"),
  organizationchart: _graph("organizationchart", "Organization Chart", "business", [{ id: "CEO" }, { id: "CTO" }, { id: "CFO" }, { id: "COO" }, { id: "Eng" }, { id: "Data" }], [{ source: "CEO", target: "CTO" }, { source: "CEO", target: "CFO" }, { source: "CEO", target: "COO" }, { source: "CTO", target: "Eng" }, { source: "CTO", target: "Data" }]),
  decisiontree:      _graph("decisiontree", "Decision Tree", "business", [{ id: "q1", label: "Budget > 1000?" }, { id: "q2", label: "Urgent?" }, { id: "buy", label: "Buy" }, { id: "wait", label: "Wait" }, { id: "rent", label: "Rent" }], [{ source: "q1", target: "q2", label: "Yes" }, { source: "q1", target: "rent", label: "No" }, { source: "q2", target: "buy", label: "Yes" }, { source: "q2", target: "wait", label: "No" }]),
  classificationtree:_graph("classificationtree", "Classification Tree", "biology", [{ id: "Animalia" }, { id: "Chordata" }, { id: "Mammalia" }, { id: "Carnivora" }, { id: "Felidae" }, { id: "Panthera" }], _chain(["Animalia", "Chordata", "Mammalia", "Carnivora", "Felidae", "Panthera"])),
  foodchain:         _graph("foodchain", "Food Chain", "biology", [{ id: "Grass" }, { id: "Grasshopper" }, { id: "Frog" }, { id: "Snake" }, { id: "Eagle" }], _chain(["Grass", "Grasshopper", "Frog", "Snake", "Eagle"]), "grid"),
  foodweb:           _graph("foodweb", "Food Web", "biology", [{ id: "Plants" }, { id: "Insect" }, { id: "Rabbit" }, { id: "Bird" }, { id: "Fox" }, { id: "Hawk" }], [{ source: "Plants", target: "Insect" }, { source: "Plants", target: "Rabbit" }, { source: "Insect", target: "Bird" }, { source: "Rabbit", target: "Fox" }, { source: "Bird", target: "Hawk" }, { source: "Fox", target: "Hawk" }, { source: "Bird", target: "Fox" }], "cose"),
});

// ---- Phase 6: business / strategy frameworks (pure SVG, no library) --------
// Carry `sample.framework = { kind, cols?, cells:[{ title, items[] }] }`.
const _fw = (type, label, category, kind, cells, extra = {}) => ({ label, category, engine: "framework", sample: { type, title: label, framework: { kind, cells, ...extra } } });

Object.assign(MODULES, {
  swot: _fw("swot", "SWOT Analysis", "business", "swot", [
    { title: "Strengths", items: ["Strong brand", "Loyal customers", "Skilled team"] },
    { title: "Weaknesses", items: ["High costs", "Limited reach", "Old tech"] },
    { title: "Opportunities", items: ["New markets", "Partnerships", "Automation"] },
    { title: "Threats", items: ["New competitors", "Regulation", "Price wars"] },
  ]),
  pestle: _fw("pestle", "PESTLE Analysis", "business", "pestle", [
    { title: "Political", items: ["Policy", "Stability"] },
    { title: "Economic", items: ["Growth", "Inflation"] },
    { title: "Social", items: ["Demographics", "Trends"] },
    { title: "Technological", items: ["Innovation", "Automation"] },
    { title: "Legal", items: ["Compliance", "Labour law"] },
    { title: "Environmental", items: ["Climate", "Sustainability"] },
  ]),
  bcgmatrix: _fw("bcgmatrix", "BCG Matrix", "business", "bcg", [
    { title: "Stars", items: ["High growth, high share"] },
    { title: "Question Marks", items: ["High growth, low share"] },
    { title: "Cash Cows", items: ["Low growth, high share"] },
    { title: "Dogs", items: ["Low growth, low share"] },
  ]),
  portersfiveforces: _fw("portersfiveforces", "Porter's Five Forces", "business", "forces", [
    { title: "Competitive Rivalry", items: ["Many rivals"] },
    { title: "New Entrants", items: ["Low barriers"] },
    { title: "Supplier Power", items: ["Few suppliers"] },
    { title: "Buyer Power", items: ["Price sensitive"] },
    { title: "Substitutes", items: ["Alternatives exist"] },
  ]),
  businessmodelcanvas: _fw("businessmodelcanvas", "Business Model Canvas", "business", "canvas", [
    { title: "Key Partners", items: [] }, { title: "Key Activities", items: [] }, { title: "Value Propositions", items: [] },
    { title: "Customer Relationships", items: [] }, { title: "Customer Segments", items: [] }, { title: "Key Resources", items: [] },
    { title: "Channels", items: [] }, { title: "Cost Structure", items: [] }, { title: "Revenue Streams", items: [] },
  ], { cols: 3 }),
  valuechain: _fw("valuechain", "Value Chain", "business", "grid", [
    { title: "Inbound Logistics", items: [] }, { title: "Operations", items: [] }, { title: "Outbound Logistics", items: [] },
    { title: "Marketing & Sales", items: [] }, { title: "Service", items: [] },
  ], { cols: 5, rows: 1 }),
  comparisonchart: _fw("comparisonchart", "Comparison Chart", "education", "grid", [
    { title: "Option A", items: ["Pro: fast", "Con: costly"] },
    { title: "Option B", items: ["Pro: cheap", "Con: slower"] },
  ], { cols: 2, rows: 1 }),
  cyclediagram: _fw("cyclediagram", "Cycle Diagram", "education", "cycle", [
    { title: "Plan" }, { title: "Do" }, { title: "Check" }, { title: "Act" },
  ]),
  causeeffect: _fw("causeeffect", "Cause & Effect", "education", "grid", [
    { title: "Cause 1", items: [] }, { title: "Cause 2", items: [] }, { title: "Effect", items: [] },
  ], { cols: 3, rows: 1 }),
});

// ---- Phase 7: maps (Leaflet engine) + geography quick-wins -----------------
const _map = (type, label, category, map) => ({ label, category, engine: "leaflet", sample: { type, title: label, map } });
const _cities = [{ lat: 28.6, lng: 77.2, label: "Delhi" }, { lat: 19.1, lng: 72.9, label: "Mumbai" }, { lat: 13.1, lng: 80.3, label: "Chennai" }, { lat: 22.6, lng: 88.4, label: "Kolkata" }];

Object.assign(MODULES, {
  map:          _map("map", "Map", "geography", { center: [20.6, 78.9], zoom: 4, markers: _cities }),
  choropleth:   _map("choropleth", "Choropleth (value markers)", "geography", { center: [20.6, 78.9], zoom: 4, scale: 4, markers: [{ lat: 28.6, lng: 77.2, label: "North · 90", value: 90 }, { lat: 19.1, lng: 72.9, label: "West · 70", value: 70 }, { lat: 13.1, lng: 80.3, label: "South · 55", value: 55 }, { lat: 22.6, lng: 88.4, label: "East · 40", value: 40 }] }),
  flowmap:      _map("flowmap", "Flow Map", "geography", { center: [20.6, 78.9], zoom: 4, markers: _cities, lines: [{ from: [28.6, 77.2], to: [19.1, 72.9] }, { from: [28.6, 77.2], to: [13.1, 80.3] }, { from: [28.6, 77.2], to: [22.6, 88.4] }] }),
  // Geography quick-wins on existing engines
  windrose:     _plotly("windrose", "Wind Rose", "geography", [{ type: "barpolar", r: [20, 15, 30, 10, 25, 18, 12, 22], theta: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], marker: { color: "#2563eb" } }], { polar: { radialaxis: { ticksuffix: "%" } } }),
  rainfallgraph: _bar("rainfallgraph", "Rainfall Graph", "geography", ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], [{ name: "Rainfall (mm)", data: [40, 35, 50, 60, 90, 120, 160, 150, 100, 70, 50, 45] }]),
  topographicprofile: _line("topographicprofile", "Topographic Profile", "geography", _range(0, 10, 1), [{ name: "Elevation (m)", data: [200, 350, 500, 720, 650, 800, 900, 750, 600, 400, 250] }], { beginAtZero: true, smooth: true }),
  elevation:    _line("elevation", "Elevation Profile", "geography", _range(0, 10, 1), [{ name: "Elevation (m)", data: [100, 180, 300, 420, 500, 610, 540, 400, 300, 220, 150] }], { beginAtZero: true, smooth: true }),
});

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
