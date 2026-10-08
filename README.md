# Recruiter AI Co-Pilot

Recruiter AI Co-Pilot is an internal AI-assisted recruiting application designed for a small HR/recruitment team.

The application provides a single workspace where recruiters can manage a job role, research the market, source candidates, evaluate CVs, communicate with candidates, conduct screening, and make the final hiring decision.

## Recruitment Workflow

Each job role works as an isolated workspace and follows 7 stages:

1. **Kick-off**

   * Define the role and hiring requirements.
   * Capture recruiter notes and initial requirements.
   * Create the job description and evaluation criteria.

2. **Market Research**

   * Analyze the role and market context.
   * Generate AI-assisted market insights.
   * Identify relevant skills, technologies, and hiring considerations.

3. **Sourcing**

   * Analyze candidate sourcing profiles.
   * Evaluate profiles from sources such as LinkedIn and Naukri.
   * Identify relevant candidates based on the job requirements.

4. **CV Assessment**

   * Upload candidate CVs.
   * Extract candidate information from PDF/TXT files.
   * Compare candidates against the job description and scorecard.
   * Generate an AI-based candidate score and summary.

5. **Outreach**

   * Generate personalized candidate messages.
   * Create interview invitations, follow-ups, or rejection messages.
   * Messages are generated using the candidate's relevant information and role requirements.

6. **Recruiter Screening**

   * Review individual candidates.
   * Generate AI-assisted screening questions and reports.
   * Record recruiter interview notes.

7. **Final Decision**

   * Review the candidate's overall strengths and gaps.
   * Assist the recruiter in making the final hiring decision.
   * Generate role-relevant final decision information without exposing confidential recruiter notes.

## Candidate Tracker

The candidate tracker provides a central view of candidates for each role.

It stores:

* Candidate name
* CV information
* AI score
* Fit category
* Summary
* Strengths
* Gaps
* Recruiter decision
* Recruiter notes

Recruiter decisions and notes are preserved when candidates are rescored or their CV is uploaded again.

The tracker supports autosaving:

* Decisions are saved immediately.
* Notes are saved after a short period of inactivity or when leaving the field.

## AI Capabilities

The application uses **Anthropic Claude through LangChain** for AI processing.

AI is used for:

* Job requirement analysis
* Market research
* Candidate sourcing analysis
* CV evaluation
* Candidate scoring
* Candidate summaries
* Candidate strengths and gaps
* Personalized outreach
* Recruiter screening
* Final decision assistance

AI-generated structured data is validated using **Zod** before being stored or used by the application.

### Candidate Scoring

Candidates receive a score from **0–100**.

| Score  | Category    |
| ------ | ----------- |
| 85–100 | Strong Fit  |
| 70–84  | Good Fit    |
| 50–69  | Average Fit |
| 0–49   | Not Fit     |

The category is derived by the server from the score.

## CV Processing

CVs are processed on the server without being permanently stored as uploaded files.

The application:

1. Validates the file type and size.
2. Validates the file signature.
3. Extracts the text in memory.
4. Sends relevant information for AI evaluation.
5. Identifies the candidate.
6. Scores the candidate.
7. Stores the extracted candidate information and evaluation results.

Currently supported:

* PDF
* TXT

Scanned/image-only PDFs and Word documents are not currently supported.

Duplicate candidates are detected using a combination of:

* File hash
* Candidate name
* Filename

## Authentication

Authentication is handled using **Better Auth**.

The application supports:

* Email/password login
* Secure sessions
* Logout
* Password change
* Temporary passwords
* Forced password change on first login
* Session revocation
* Login rate limiting

User registration is disabled.

The application is intended for a small internal team rather than public self-registration.

## Role Isolation

Each job role has its own isolated data.

A recruiter can switch between roles, but candidates, stages, sourcing profiles, and generated information remain associated with the selected role.

All server-side database operations explicitly validate the `roleId` to prevent cross-role access.

## Application Architecture

The application is built as a **single Next.js application**.

```text
Browser
   │
   ├── Better Auth
   │
   └── Next.js
        │
        ├── Server Components
        ├── Route Handlers
        ├── Workflow Logic
        ├── AI / LangChain
        │      │
        │      └── Anthropic Claude
        │
        └── Prisma
               │
               └── MySQL
```

There is no separate backend service, queue, Redis worker, or AI server.

The application runs the workflow and AI processing inside the Next.js server process.

## Technology Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS 4
* App Router
* Server Components

### Backend

* Next.js Route Handlers
* Better Auth
* Prisma ORM
* MySQL 8

### AI

* LangChain
* Anthropic Claude
* Zod structured validation

### CV Processing

* pdf.js / `unpdf`
* In-memory document processing

### Deployment

The application can run on:

* VPS
* Render
* Railway

PM2 and Nginx can be used for a traditional VPS deployment.

## Security

The application is designed to keep recruiting data isolated and server-controlled.

Important security principles include:

* Authentication checked on the server
* Role-level authorization
* Secure session cookies
* Password hashing
* CV files are not permanently stored
* CVs are not publicly accessible
* Sensitive AI prompts and responses are not logged
* API keys remain server-side
* User-provided text is treated as data
* Reference URLs are not fetched by the server
* Security-related HTTP headers are enabled

## Current Limitations

* No OCR for scanned PDFs
* DOC/DOCX files are not supported
* Market research is AI-generated and not live web research
* AI generation runs inside the request
* Large candidate batches can take several minutes
* Rate limiting is designed primarily for a single application instance
* No admin UI for user management
* Duplicate detection is heuristic
* Stage history/versioning is not currently maintained

## Intended Users

The application is primarily designed for a small recruitment/HR team of approximately **3–4 users**.

The goal is to reduce repetitive recruiter work while keeping the recruiter involved in every important hiring decision.

## Overall Flow

```text
Job Role
   │
   ▼
Kick-off
   │
   ▼
Market Research
   │
   ▼
Sourcing
   │
   ▼
CV Assessment
   │
   ▼
Outreach
   │
   ▼
Recruiter Screening
   │
   ▼
Final Decision
```

The application combines **recruiter decisions + structured recruiting data + AI assistance** into one workflow rather than replacing the recruiter with fully automated hiring decisions.
