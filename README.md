# My Study Guide

A modern, responsive, **full-stack** educational platform for **quizzes and test-series preparation**.
Blue/white/orange theme, dark + light mode, smooth animations, charts, dashboards and a full admin panel.

```
.
├── frontend/      # React + Vite + Tailwind CSS (UI for all modules)
├── backend/       # Node.js + Express + MongoDB REST API (JWT auth, Cloudinary)
└── DEPLOYMENT.md  # Step-by-step guide to publish the full app online
```

> **Real mode is wired up:** the frontend talks to the backend API for real login/registration
> (JWT), database-backed subjects, sessions, questions, quiz attempts, test grading, dashboard
> analytics, leaderboard, and the admin panel. Set `VITE_API_URL` in the frontend and run the
> backend with a MongoDB connection. See **[DEPLOYMENT.md](DEPLOYMENT.md)** to go live.

## 🚀 Run locally (real mode)

```bash
# 1) Backend  (needs a MongoDB connection string)
cd backend
npm install
cp .env.example .env          # set MONGO_URI and JWT_SECRET
npm run seed                  # sample data + admin/student logins
npm run dev                   # http://localhost:5000

# 2) Frontend  (in a second terminal)
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                   # http://localhost:5173
```

Seeded demo logins (development only): **admin@mystudyguide.com** / `<ADMIN_PASSWORD>` · **student@mystudyguide.com** / `<SEED_STUDENT_PASSWORD>`. The passwords are placeholders — set the real values via `ADMIN_PASSWORD` / `SEED_STUDENT_PASSWORD` in `backend/.env` (see [`backend/.env.example`](backend/.env.example)), and change them before any public deployment.

## ✨ Features

**Public site**
- Landing page — hero ("Prepare Smart, Achieve More."), features, stats, footer with social links
- Quiz module — 12 subjects → chapter sessions → interactive quiz player
  - One question at a time, correct option turns **green**, wrong turns **red** (correct auto-revealed)
  - Timer, question palette, bookmark, explanation, progress bar, auto-save, submit
  - Result page — score, %, time, rank, performance charts, weak-topic analysis, answer review
- About & Contact pages

**Auth**
- Login, Register (with email-verification step), Forgot Password, Google login button

**Student Dashboard** (auth required)
- Profile, enrolled series, upcoming/completed tests, recent scores, analytics charts, leaderboard, notifications

**Test Series** (login to start)
- Full-length / subject-wise / chapter-wise / previous-year tabs
- Full-screen test interface — countdown with auto-submit, palette with statuses, mark-for-review, save & next

**Admin Panel** (role-based)
- Dashboard analytics (revenue, attempts, subscriptions)
- Content management (subjects, sessions, questions) with CRUD, bulk CSV upload, image upload
- Test-series management (create, schedule, publish/unpublish)
- User management (view, block/unblock, plans, reset password)
- Customization (logo, theme colours, banners, notifications, announcements)

See [`backend/README.md`](backend/README.md) for the full API reference. Both
run-locally steps (backend + frontend) are in **[Run locally](#-run-locally-real-mode)** above.

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS, React Router, Chart.js, lucide-react |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Cloudinary, Multer |
| Cross-cutting | Dark/light mode, responsive design, SEO meta tags, role-based auth |

## 🔗 Frontend ↔ backend

The frontend talks to the backend REST API for everything — authentication
(JWT), subjects/sessions/questions, quiz attempts, test grading, dashboards, and
the admin panel. It reads the API base URL from `VITE_API_URL` (e.g.
`http://localhost:5000/api`) and stores the returned JWT in the browser. There
is **no** mock/offline mode: a running backend with a MongoDB connection is
required. See **[DEPLOYMENT.md](DEPLOYMENT.md)** to deploy both halves.
