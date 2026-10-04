# LGION learning platform

A standalone Next.js App Router frontend for the LGION Django API. All frontend source and configuration live in this directory; the backend project remains untouched.

## Run locally

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Django API root. The default is `http://127.0.0.1:8000/api/v1`. Run Django separately and allow the frontend origin in the backend's CORS configuration.

## Pages

- `/` — public welcome page
- `/login`, `/register`, `/forgot-password` — separate sign-in, account creation, and password reset pages
- `/student/*` — student dashboard, batch discovery and comparison, enrollments, live classes, study library, tests, doubts, tutoring, achievements, payments, certificates, referrals, support, profile, and security
- `/teacher/*` — teacher dashboard, batches and rosters, live classes, courses, content, recordings, tests, doubts, tutoring, earnings, performance, payouts, and profile

Student and teacher sections are separate pages backed by the existing `/api/v1/` endpoints. Live-class pages have dedicated class-list and class-control modules: teachers can start/join scheduled classes and explicitly confirm ending a live class, while students can join their eligible classes. Agora credentials from the backend are used to connect the browser classroom; the teacher can publish camera/microphone media, and students join as viewers. The browser will request camera/microphone permission for teacher accounts. Lists and dashboards only show records returned by the API; empty, loading, sign-in, and error states are displayed explicitly rather than filled with sample data. Sign-in stores the short-lived access token in browser storage and sends it as a Bearer token with authenticated requests. Protected pages require a real signed-in account.

Students and teachers can create support tickets through a regular form; the frontend serializes the entered fields into the JSON request expected by the API.

The development server is configured for port `3000`:

```powershell
npm run dev
```

## Build

```powershell
npm run build
```
