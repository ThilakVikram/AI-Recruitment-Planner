# Recruiter AI Co-Pilot

Recruiter AI Co-Pilot is an internal AI-assisted recruiting application for a small HR/recruitment team.

It takes each hiring drive from the hiring manager kick-off meeting to the final decision: AI-written job documents, market research and sourcing strategy, CVs ranked against the job description, and outreach, screening and decision messages for every applicant — with the recruiter making every decision.

> Setup instructions are in [INSTALLATION.md](INSTALLATION.md).

## How it works

```text
Role ──► Recruitment ──► Applicants ──► Interview ──► Final decision
          │                 │              │              │
          │ kick-off notes  │ CV score     │ outreach     │ Selected / On hold / Rejected
          │ Job Management  │ 0–100, rank  │ screening    │ rejection message
          │ market research │              │ report       │
          │ sourcing        │              │              │
```

1. **Create a role** — the requisition: department, location, work mode, experience, salary, skills, openings, priority and status.
2. **Start a recruitment** for the role — only the role is required. Openings default to the role's and can be changed per recruitment; a summary can be added later.
3. **Fill in the recruitment steps** and let the AI write the hiring documents.
4. **Attach applicants** — CVs or analysed LinkedIn / Naukri profiles — each scored and ranked against the job description.
5. **Work each applicant** — decide, interview, write messages, and record the final decision.

## Pages

| Page | What it's for |
| --- | --- |
| **Home** | Account, headline counts (open roles, active recruitments, talent pool, awaiting decision, moved to interview, selected), active recruitments, roles and a how-it-works guide. |
| **Roles** | One full-width row per role with its pipeline counts: applicants, interview, hold, selected, rejected. A role page shows the requisition form, its pipeline, recruitments and linked applicants. |
| **Recruitment** | All hiring drives (REC-001, REC-002…). A recruitment page shows the role overview, status, openings and summary, the ranked applicants list, and the recruitment steps. |
| **Applicants** | The shared talent pool — contact details, CVs and other documents, custom details, and every recruitment the applicant is part of. |

## Recruitment steps

Each recruitment has four steps. The AI steps unlock once kick-off notes are saved.

1. **Kick-off meeting notes** — fill in the form topic by topic (responsibilities, skills, experience, team), or paste the full notes and let the AI sort them into the form.
2. **Job Management** — job description, role scorecard, LinkedIn post, Naukri post and other channel posts, plus open questions for the hiring manager. CVs are scored against this JD.
3. **Market research** — sourcing plan, talent market map, target companies, target candidate profiles, market observations and sourcing channels. AI-generated, not live web research.
4. **Sourcing strategy** — sourcing and channel strategy, Boolean search strings, target profile characteristics, and a ranked shortlist of analysed profiles.

Every output is shown in tabs with a copy button and can be regenerated with extra instructions.

### Adding applicants

* **Attach applicant file** — drop up to 10 PDF/TXT CVs. Each is read, matched to an existing applicant or added to the talent pool, then scored 0–100 against the JD.
* **Profile analysis** — paste a LinkedIn or Naukri profile (reference URLs are never fetched). It is scored and can be added to the recruitment as an applicant.

## Working with an applicant

Clicking an applicant on a recruitment page opens a side panel. It can be resized by dragging its left edge (double-click to reset), and the same details and tools are available on the applicant's page under **Recruitments**.

| Item | Shown when | What it does |
| --- | --- | --- |
| **Score & assessment** | Always | Score /100, fit category, rank, summary, strengths and gaps. |
| **Decision** | Always | Pending · Proceed to interview · Hold · Reject. |
| **Final decision** | Always (panel header) | Selected · On hold · Rejected. Click the active one again to clear it. |
| **Outreach messages** | Decision = Proceed to interview | Personalised LinkedIn InMail, email and WhatsApp messages, each in its own tab. |
| **Recruiter screening** | Decision = Proceed to interview | Interview screening notes are saved on the applicant; the AI turns them into a screening report against the scorecard (overview, experience, strengths & concerns, scorecard alignment, observations, Proceed/Hold/Reject recommendation, follow-up questions). |
| **Final decision messages** | Final decision = Rejected | A kind rejection email with constructive feedback. Scores, decisions and recruiter notes are never sent to this prompt. |

Outreach and screening need Job Management to be generated first. Each output is saved per applicant per recruitment and can be regenerated with extra instructions. Decisions are never overwritten when a CV is rescored.

### Pipeline counts

Role and home-page counts are taken across a role's recruitments, counting each applicant once per role:

* **Interview** — Decision is *Proceed to interview*.
* **Hold** — Final decision is *On hold*, or Decision is *Hold* with no final decision yet.
* **Selected** — Final decision is *Selected*.
* **Rejected** — Final decision is *Rejected*, or Decision is *Reject*.

## AI

The application uses **Anthropic Claude through LangChain**. Structured AI output is validated with **Zod** before it is stored or shown.

AI is used for: sorting kick-off notes, job documents, market research, sourcing strategy, LinkedIn/Naukri profile analysis, CV extraction and scoring, outreach, screening reports and rejection messages.

Prompts receive the role's requisition details, the recruitment's openings and summary, and the outputs each step builds on. User-provided text is treated as data.

### Candidate scoring

| Score  | Category    |
| ------ | ----------- |
| 85–100 | Strong Fit  |
| 70–84  | Good Fit    |
| 50–69  | Average Fit |
| 0–49   | Not Fit     |

The category is derived by the server from the score.

## CV and document handling

* Recruitment CV uploads accept **PDF and TXT** (scanned/image-only PDFs are not supported). File type, size and signature are validated, and text is extracted in memory.
* Uploaded CVs and applicant documents (PDF, DOC/DOCX, TXT, PNG/JPG — up to 10 MB each) are **stored in the database** on the applicant and served only to signed-in users.
* Applicants are matched by file hash, then email, then name within the same recruitment. Existing applicant details are only filled in where blank — recruiter-entered details are never overwritten.

## Authentication

Authentication uses **Better Auth**: email/password login, secure sessions, logout, password change, temporary passwords with a forced change on first login, session revocation and login rate limiting. Self-registration is disabled — users are created with the seed script.

## Architecture

A **single Next.js application** — there is no separate backend service, queue, worker or AI server. AI generation runs inside the request.

```text
Browser
   │
   ├── Better Auth
   │
   └── Next.js
        ├── Server Components
        ├── Route Handlers
        ├── AI / LangChain ──► Anthropic Claude
        └── Prisma ──► MySQL
```

## Technology stack

* **Frontend:** Next.js 16 (App Router, Server Components), React 19, TypeScript, Tailwind CSS 4
* **Backend:** Next.js Route Handlers, Better Auth, Prisma 7, MySQL 8
* **AI:** LangChain, Anthropic Claude, Zod
* **Documents:** `unpdf` (pdf.js), in-memory text extraction
* **Deployment:** VPS (PM2 + Nginx), Render or Railway

## Security

* Authentication is checked on the server for every page and API route.
* Secure session cookies and hashed passwords.
* Stored CVs and documents are only served to signed-in users.
* API keys stay server-side; AI prompts and responses are not logged.
* Candidate-facing messages never include scores, decisions or internal notes.
* Reference URLs are never fetched by the server.
* Security-related HTTP headers are enabled.

## Current limitations

* No OCR for scanned PDFs; recruitment CV scoring accepts PDF/TXT only.
* Market research is AI-generated, not live web research.
* AI generation runs inside the request — larger CV batches can take a few minutes.
* Rate limiting is designed for a single application instance.
* No admin UI for user management.
* Applicant matching is heuristic.
* Only the latest version of each AI output is kept.

## Notes for developers

* The previous 7-stage **Workflow** and **Candidate Tracker** pages have been removed; their features now live in Recruitment and the applicant panel. Their old database tables (`role_stage`, `candidate`, `candidate_cv`, `candidate_tracker`, `sourcing_profile`) are still in the schema but are no longer read or written.
* After pulling changes, run `npm run db:deploy` (or `npm run db:migrate` in development) to apply new migrations, then restart the server.

## Intended users

A small recruitment/HR team of about **3–4 users**. The goal is to reduce repetitive recruiter work while keeping the recruiter in charge of every hiring decision.
