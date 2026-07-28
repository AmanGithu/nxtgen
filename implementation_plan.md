# NxtGen Academy — Full Production Implementation Plan

**NxtGen Academy** is a production-ready Learning Management System (LMS) and AI-powered career acceleration platform. It's a sub-brand under PAVY, focused exclusively on education — offering courses in AI, Data Analytics, and Database Administration, with integrated career tools (Resume Builder, ATS Checker, Interview Prep, LinkedIn Analyser), subscription-based premium features, and advanced AI interview capabilities.

> **Dual Branding**: NxtGen Academy operates at `nxtgen.pavy.ai` as a standalone platform. Clicking "Explore More" or any course on PAVY's `/academy` page redirects here.

---

## User Interview Summary

| Decision | Choice |
|---|---|
| **Purpose** | Production-ready platform for real students & corporate clients |
| **Frontend** | Vite + React (TypeScript) |
| **Backend** | Node.js + Express.js |
| **Database** | MariaDB/MySQL (port 3306, already running) |
| **ORM** | Prisma ORM |
| **Styling** | Tailwind CSS v4 + Custom CSS for animations |
| **Auth** | Unified Identity by email: Admin-invited Students (via Resend password set link) + OAuth (Google/GitHub) for Site Users with automated account linking |
| **AI Provider** | Gemini API via Unified AI Service — Primary: `gemini-1.5-flash` / `gemini-1.5-pro`, Fallback: `gemini-1.5-flash`, Voice: `gemini-2.0-flash-exp` (env-driven) |
| **File Storage** | AWS S3 / Cloudflare R2 / Firebase via Pre-signed Upload URLs |
| **Task Queue** | Redis + BullMQ (or in-memory fallback) for async AI workloads |
| **Hosting Strategy** | Decoupled 2-Tier: Frontend (Vercel CDN) + REST Backend (cPanel Node.js / Render) + Real-time WebSockets (Render / VPS) |
| **Delivery** | **Phase 1A**: Core LMS & Website → **Phase 1B**: Core AI Tools Suite → **Phase 2**: Real-Time AI Tools & Hardware |

---

## Critic Audit Resolutions & Hosting Strategy

| # | Critic Issue | Resolved Architecture & Technical Fix | Developer Action |
|---|---|---|---|
| 1 | cPanel Audio Streaming | **Decoupled Backend Architecture**: REST API runs on cPanel Node.js. Real-time audio WebSockets (I-Assist / Gemini Live) deployed on Render.com persistent worker / VPS. | Configure `VITE_API_URL` for REST and `VITE_WS_URL` for WebSockets |
| 2 | DRM-Lite Fallacy | **Access-Control + Dynamic Watermarking**: Acknowledge Drive embed as access-controlled viewing. Overlay dynamic canvas/player watermark with student name, email, IP address, and timestamp. | Implement `VideoPlayer.tsx` with dynamic canvas watermark overlay |
| 3 | Gemini Model Strings & Queue | **Verified Model Env Vars + BullMQ**: Use stable model IDs (`gemini-1.5-flash`, `gemini-1.5-pro`) loaded from `.env`. Queue heavy tasks (ATS, Resume Tailoring) via BullMQ + Redis. | Use `process.env.GEMINI_PRIMARY_MODEL` and BullMQ `aiTaskQueue` |
| 4 | Ephemeral Local Storage | **S3 / Cloudflare R2 Direct Uploads**: Upload files directly from client to S3/R2 using backend pre-signed URLs (`/api/storage/presigned-url`). | Implement `storageService.ts` using `@aws-sdk/s3-request-presigner` |
| 5 | Identity Fragmentation | **Unified User Model & Account Linking**: Single `User` table keyed by normalized email. NextAuth automatically links Google/GitHub OAuth accounts to existing Student records. | Set `allowDangerousEmailAccountLinking: true` in NextAuth config |
| 6 | Missing Transactional Email | **Resend Mailer + Password Set Links**: Admin invitations send a 24-hour cryptographic token link (`/set-password?token=xxx`) via Resend API instead of plaintext passwords. | Add `emailService.ts` powered by `resend` package |
| 7 | Deterministic PDF Parsing Fragility | **Hybrid Regex + Gemini Vision Parser**: Run `pdf-parse` first. If output is garbled or < 150 chars, fallback to Gemini Vision (`gemini-1.5-flash`) for structural JSON extraction. | Implement fallback logic in `server/src/services/pdfParser.ts` |

---

## Phase 1 — Core Platform (Current Scope)

### Architecture Overview (Optimized for Speed)

> [!TIP]
> Architecture optimized for **fast rendering** like ResumeGyani.in — server-side data fetching, client-side SPA routing with code-splitting, aggressive caching, and CDN-served static assets.

### Architecture Overview (Decoupled & Resilient)

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend Client (Vercel CDN)                 │
│              Vite + React 19 + TypeScript                    │
│         Tailwind CSS v4 + Dynamic Watermark Canvas           │
│         React Router v7 (Lazy routes & prefetching)          │
│         React Query (Client caching & SWR)                   │
├──────────────────────────────┬──────────────────────────────┤
│    REST API Backend          │  Real-Time WebSocket Service │
│ (cPanel Node.js / Render)    │      (Render / VPS)          │
│  - Express.js + TypeScript   │  - WS Server (I-Assist)       │
│  - Prisma ORM (MySQL)        │  - Gemini Live Audio Stream  │
│  - Resend Email Service      │  - LiveKit WebRTC Gateway    │
│  - S3 Presigned URL Generator│                              │
├──────────────────────────────┴──────────────────────────────┤
│              Async Task Queue (Redis + BullMQ)               │
│  - ATS Scoring & Resume Tailoring Workers                    │
│  - Gemini AI Rate-Limitation & Automatic Retries             │
├─────────────────────────────────────────────────────────────┤
│                    Database & Storage                        │
│  - MariaDB/MySQL (Port 3306)                                │
│  - AWS S3 / Cloudflare R2 (PDFs, Resumes, Templates)        │
└─────────────────────────────────────────────────────────────┘
```

**Speed Optimizations:**
- **Code splitting** — Each route/tool lazily loaded (only loads JS for the current page)
- **React Query / SWR** — Client-side data caching with stale-while-revalidate pattern
- **CDN-served SPA** — Vite build deployed to Vercel edge CDN for instant static asset delivery
- **API response caching** — Redis cache for frequently accessed data (courses, certifications, menu)
- **Image optimization** — WebP/AVIF with lazy loading and blur placeholders
- **Prefetching** — Link hover triggers route/data prefetching for instant navigation

---

## Proposed Changes

### Component 1: Project Scaffolding & Configuration

#### [NEW] Project Root Structure
```
d:\Product Development\NxtGen_Academy\
├── client/                    # Vite + React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── layouts/           # Layout wrappers (Public, Dashboard)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # Auth, Theme contexts
│   │   ├── services/          # API client services
│   │   ├── styles/            # Custom CSS + animations
│   │   ├── assets/            # Images, fonts, icons
│   │   └── utils/             # Helper functions
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── services/          # AI, storage, email services
│   │   ├── lib/               # Utilities, parsers
│   │   └── config/            # Environment, constants
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.ts            # Seed data (courses, certifications)
│   │   └── migrations/        # Migration history
│   └── package.json
├── shared/                    # Shared types & constants
│   └── types/
├── Screenshots/               # Reference images (existing)
├── requirement.md             # Requirements (existing)
├── DESIGN.md                  # Design spec (existing)
└── skill.md                   # Agent skills (existing)
```

---

### Component 2: Database Schema (MariaDB/MySQL via Prisma)

#### [NEW] [schema.prisma](file:///d:/Product%20Development/NxtGen_Academy/server/prisma/schema.prisma)

**Core Identity & Auth Models:**

| Model | Purpose |
|---|---|
| `User` | Primary user table — email (unique, normalized), passwordHash, firstName, lastName, avatarUrl, role (ADMIN/STUDENT/SITE_USER), status, oauthProvider |
| `UserInviteToken` | 24-hour cryptographic token for password set links sent via Resend email |
| `Session` | JWT session tracking with refresh tokens |
| `Account` | OAuth provider link table (Google, GitHub) — automatically linked to existing User record by email |

> [!NOTE]
> **Unified Auth & Account Linking Flow:**
> - **Student Onboarding**: Admin enters email & role → System creates `User` + `UserInviteToken` → Sends email via Resend with link `nxtgen.pavy.ai/set-password?token=xyz` → Student sets password.
> - **OAuth Account Linking**: If a Student registers or logs in via Google/GitHub OAuth, NextAuth matches the verified email address and links the `Account` record to their existing `User` profile without duplicate record creation.

**Academy & Learning Models:**

| Model | Purpose |
|---|---|
| `Course` | Course catalog — title, slug, category (AI/DATABASE), description, modules (JSON), thumbnail, duration, prerequisites |
| `Batch` | Batch configuration — name, courseId, startDate, **endDate** (= max date until which student has course access), maxStudents, driveFolder, status |
| `BatchStudent` | Many-to-many: batch ↔ student enrollment |
| `ClassSchedule` | Scheduled classes — batchId, title, dateTime, zoomLink, duration, status |
| `StudyMaterial` | Materials per batch — type (NOTES/RECORDING/ASSIGNMENT/QUIZ), title, driveFileId, **createdAt** (sorted by date descending — latest first) |
| `StudentProgress` | Track per-student course progress — completedModules, assignmentScores, quizScores |
| `Certification` | 200+ certifications — name, provider, link, prerequisite, courseId, isActive, **ctaEnabled** (boolean) |
| `CourseCertification` | Many-to-many: course ↔ applicable certifications |
| `CertificationInquiry` | CTA popup submissions — certificationId, certificationName, userName, userEmail, userPhone, message, status (NEW/CONTACTED/CLOSED), createdAt |
| `Internship` | Internship programs — title, description, programType (GENERATIVE_AI/AGENTIC_AI), duration, eligibility, learningOutcomes (JSON), isActive, applicationLink, startDate |

**Corporate & Upcoming Models:**

| Model | Purpose |
|---|---|
| `UpcomingBatch` | Admin-configured upcoming batches — courseName, startDate, webinarDate, description, isPublished |
| `CorporateCourse` | Admin-configured corporate courses — courseId, customDescription, targetAudience |

**Tool & Subscription Models:**

| Model | Purpose |
|---|---|
| `Subscription` | User subscriptions — userId, plan (FREE/BASIC/PRO/ENTERPRISE), status, startDate, endDate |
| `CreditBalance` | Credit-based usage — userId, totalCredits, usedCredits, lastRecharge |
| `ToolUsageLog` | Track tool usage — userId, toolName, inputPayload, outputPayload, creditsConsumed, timestamp |
| `ResumeTemplate` | Resume templates — name, category (FREE/PREMIUM), htmlTemplate, cssStyles, thumbnail |
| `UserResume` | User's saved resumes — userId, templateId, resumeData (JSON), title, lastModified |

**Admin Configuration Models:**

| Model | Purpose |
|---|---|
| `MenuItem` | Editable menu items — label, href, parentId, sortOrder, isActive |
| `HeroBanner` | Sliding hero banners — title, subtitle, imageUrl, ctaText, ctaLink, sortOrder |
| `SiteConfig` | Key-value site settings — geminiPrimaryModel, geminiFallbackModel, etc. |
| `AuditLog` | Admin action logs — userId, action, targetModel, targetId, payload, timestamp |

---

### Component 3: Public Website Pages

#### [NEW] Home Page (`/`)
Based on [Theme.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/Theme.png) and Pavy `/academy` structure:

- **Header**: Fixed navigation bar — Logo | NxtGen Academy | Menu items (**Home, Courses, Certifications, Internship, Tools ▼, Upcoming Batches, Corporate, Login/Signup**) — editable from Admin
- **Hero Section**: Full-width autonomous carousel slider (inspired by SmartSlider3)
  - Split layout: text overlay (left half) + images (right half) per [1.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/1.png) and [2.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/2.png)
  - Auto-sliding with pause-on-hover, dot navigation, swipe support
  - Deep dark background with orange accent CTAs
- **Courses Section**: Interactive tiles with creative punchlines + "Explore More" buttons
  - Punchline: *"Master the Technologies of Tomorrow"*
- **Certifications Section**: Highlight certification offerings + "Explore More"
  - Punchline: *"200+ Industry-Recognized Certifications"*
- **Internship Section**: Highlight internship programs for Generative AI & Agentic AI + "Apply Now" buttons
  - Punchline: *"Launch Your AI Career — Real-World Internships That Matter"*
- **Tools Slider Section**: Horizontal slider showcasing all career tools with headlines
  - Punchline: *"AI-Powered Career Toolkit — From Resume to Job Offer"*
- **Corporate Training Section**: Enterprise focus with course slider
  - Punchline: *"Upskill Your Workforce at Scale"*
- **Footer**: 4-column layout per Pavy footer structure
  - Brand + tagline + socials | Courses | Internship & Tools | Legal

#### [NEW] Courses Page (`/courses`)
- **Tab navigation** for technology sections (AI default, Database Administrator)
- **AI Section** (default active):
  1. Data Analyst with GenAI — content from [Data analyst with AI.pdf](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/Data%20analyst%20with%20AI.pdf) + [data Analyst with AI.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/data%20Analyst%20with%20AI.png)
  2. Generative AI Master Class — from [GENERATIVE AI MASTERCLASS.pdf](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/GENERATIVE%20AI%20MASTERCLASS.pdf) + [Genertaive AI.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/Genertaive%20AI.png)
  3. Agentic AI — from [agnetic Ai.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/agnetic%20Ai.png) (content AI-generated)
  4. Prompt Engineering — from [Prompt engineering.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/Prompt%20engineering.png)
  5. Python for Programmers — from [PYTHON FOR AI PROGRAMMER MASTERCLASS.pdf](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/PYTHON%20FOR%20AI%20PROGRAMMER%20MASTERCLASS.pdf) + [Python for Developer.pdf](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/Python%20for%20Developer.pdf)
- **Database Administrator Section**:
  1. Azure and SQL DBA — from [Azure MSSQL DBA.pdf](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/Azure%20MSSQL%20DBA.pdf)
  2. PostgreSQL DBA — Structured identically to Azure MSSQL DBA, substituting PostgreSQL platform tools (pgAdmin, psql, WAL archiving, streaming replication, pg_dump, vacuuming)
  3. Oracle DBA — Structured identically to Azure MSSQL DBA (RMAN, Data Guard, RAC, SQL*Plus)
  4. MySQL DBA — Structured identically to Azure MSSQL DBA (MySQL Workbench, InnoDB, binary logs, replication)
- Each course tile expands to show full curriculum, modules, prerequisites, career outcomes

#### [NEW] Certifications Page (`/certifications`)
- Grid of 200 certification tiles parsed from [certification.pdf](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/certification.pdf)
- Each tile shows: Name | Provider | Prerequisite | **"Contact Us" CTA button**
- **CTA Behavior**: Clicking "Contact Us" opens a **popup modal** pre-filled with the certification name and ID, allowing the user to submit an inquiry (name, email, phone, message)
- Search/filter by name, provider, prerequisite
- Admin can CRUD from dashboard (soft-delete with `isActive` flag)

#### [NEW] Internship Page (`/internship`)
- Dedicated page showcasing internship programs for Generative AI & Agentic AI:
  - **Generative AI Internship**: Hands-on project-based AI internship covering LLMs, prompt engineering, RAG, and AI application building. Includes featured projects:
    - *Build an AI Call Center with LiveKit* (Speech-to-speech AI agent with WebRTC)
    - *Make Your Own AI Receptionist with ElevenLabs Conversational AI*
  - **Agentic AI Internship**: Advanced internship focused on building autonomous AI agent systems, multi-agent orchestration, and tool integration. Includes capstone agentic projects.
- Each internship card shows: Program Title | Duration | Eligibility | Key Projects | Learning Outcomes | Start Date | "Apply Now" CTA
- Admin manages internship programs from dashboard (CRUD)

#### [NEW] Tools Page — Dropdown-based (no standalone page)
Tools section renders as a **dropdown menu** in the navigation, with each tool having its own dedicated page/route:

| Tool | Route | Functionality Reference |
|---|---|---|
| Resume Builder | `/tools/resume-builder` | 3 modes: Build from scratch, from LinkedIn PDF, from upload — per MindSync Resume Builder |
| Upload & Enhance | `/tools/upload-enhance` | AI resume parser + enhancer |
| ATS Score Checker | `/tools/ats-checker` | Score resume against ATS systems (0-100%) |
| JD Resume Builder / Tailor Resume | `/tools/tailor-resume` | Match resume to specific Job Description |
| Cover Letter Builder | `/tools/cover-letter` | AI cover letter generation |
| LinkedIn Profile Analyser | `/tools/linkedin-analyser` | LinkedIn profile scoring + optimization |
| Interview Prep Kit | `/tools/interview-prep` | AI-generated 20 Q&A per JD |
| I-Assist (Echo Desktop) | `/tools/i-assist` | Live real-time speech teleprompter & AI interview co-pilot — from MindSync project |

#### [NEW] Upcoming Batches Page (`/upcoming-batches`)
- Data Analyst with GenAI starting Aug 3rd (admin-configurable)
- List view with batch name, course, start date, webinar date, enrollment CTA
- Content managed from Admin dashboard

#### [NEW] Corporate Page (`/corporate`)
- Shows first 3 courses from AI Section (admin-configurable)
- Enterprise training features + contact/inquiry form
- Content managed from Admin dashboard

#### [NEW] Login/Signup Page (`/login`)
- Glassmorphic dark card (per Pavy login page style)
- **Two distinct flows:**
  1. **Student Login**: Email + Password form (for admin-created accounts) → if `mustChangePassword` is true, redirect to password change screen on first login
  2. **Site User Login/Signup**: Google OAuth + GitHub OAuth buttons → auto-registers as `SITE_USER` → can access and subscribe to tools
- "Forgot Password" flow with email reset
- **No self-signup for students** — Admin creates accounts via User Management, system generates a random password, and sends welcome email with credentials
- Clear visual separation between student login and OAuth-based site user login

---

### Component 4: Admin Dashboard

Based on [d3.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/d3.png) (sidebar structure) and Pavy admin dashboard patterns:

#### Layout
- **Fixed left sidebar** with icon + label menu (collapsible, per d3.png and dashboard1.png style)
- **Fluid main content area** with top action bar
- **Dark theme** matching the NxtGen brand

#### Admin Dashboard Modules

| Module | Route | Functionality |
|---|---|---|
| **Overview** | `/dashboard/admin` | KPI cards (total students, active batches, revenue, tool usage), recent activity feed |
| **User Management** | `/dashboard/admin/users` | Create users with **system-generated password** → auto-send welcome email with userId + password → assign roles (ADMIN/STUDENT/SITE_USER), search/filter, inline role editor |
| **Batch Configuration** | `/dashboard/admin/batches` | Create batch, add students, link course, link certifications, set Google Drive folder, **set endDate (= max access duration for students)** |
| **Class Scheduler** | `/dashboard/admin/scheduler` | Select batch → select course → enter date/time, Zoom link, topic. Calendar view + list view |
| **Upcoming Batches** | `/dashboard/admin/upcoming` | CRUD upcoming batches — name, course, launch date, webinar before launch |
| **Corporate Courses** | `/dashboard/admin/corporate` | Select courses for corporate page, add custom descriptions |
| **Internship Programs** | `/dashboard/admin/internships` | CRUD internship programs — title, type (Generative AI / Agentic AI), duration, eligibility, outcomes, start date, application link |
| **Study Materials** | `/dashboard/admin/materials` | Upload/link materials per batch — study notes, class notes, recorded sessions (Drive links), assignments, quizzes. **Sorted by date descending (latest first)** |
| **Certifications** | `/dashboard/admin/certifications` | CRUD 200+ certifications, soft-delete (flag inactive), bulk import from PDF, **manage CTA popup settings** |
| **Certification Inquiries** | `/dashboard/admin/cert-inquiries` | View/manage certification inquiry submissions from CTA popups — filter by status (NEW/CONTACTED/CLOSED) |
| **Menu Editor** | `/dashboard/admin/menu` | Edit navigation menu items, reorder, toggle visibility |
| **Hero Banners** | `/dashboard/admin/banners` | CRUD hero slider banners — upload images, set text overlay, CTAs |
| **Resume Templates** | `/dashboard/admin/templates` | Upload resume snapshot → AI generates template → approve → add to library (Free/Premium categorization) |
| **AI Configuration** | `/dashboard/admin/ai-config` | Set Gemini primary model (`gemini-3.5-flash`), fallback model (`gemini-2.5-flash`), voice model (`gemini-3.5-flash-preview`), API keys, usage limits |
| **Audit Logs** | `/dashboard/admin/logs` | View all admin actions with timestamps, user, action type |

---

### Component 5: Student Dashboard

Based on [course_overview.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/course_overview.png) and [dashboard1.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/dashboard1.png):

#### Layout
- **Left vertical sidebar** (collapsible, icon + label, Gemini/ChatGPT landing page style)
- **Center main content area**
- Dark theme with orange accent

#### Student Dashboard Flow

**Landing**: Grid of enrolled course tiles (can be 1 or more)

**On Course Click** → Opens course view with left sidebar menu:

| Sidebar Item | Functionality |
|---|---|
| **Overview** | Course progress (donut chart — % complete), module progress bars, upcoming classes, assignments due (per course_overview.png) |
| **Study Material** | Horizontal tabs: Study Material \| Class Notes \| Recorded Sessions \| Assignments \| Quizzes — content from admin-configured Google Drive (rendered inline, **no download**) |
| **Class Schedule** | Scheduled classes with name, date, time, Zoom link (click to join). Data from admin Class Scheduler |
| **Certification** | Only certifications applicable to this course |
| **Resume Builder** | 🔒 Subscription-locked — links to Resume Builder tool |
| **Cover Letter** | 🔒 Subscription-locked — links to Cover Letter Builder |
| **Tailor Resume** | 🔒 Subscription-locked — links to JD Resume Builder |
| **LinkedIn Analyser** | 🔒 Subscription-locked — links to LinkedIn Analyser |
| **ATS Score Checker** | 🔒 Subscription-locked — links to ATS Checker |
| **Interview Preparation** | 🔒 Subscription-locked — links to Interview Prep Kit |
| **Live Interview Prep** | 🔒 Exclusive (credit-based) — Two tabs: Voice-only AI interview + Full avatar interview |
| **Interview Assist** | 🔒 Exclusive (credit-based) — Echo Desktop live teleprompter (Phase 2) |
| **Job Support** | 🔒 Exclusive separate subscription — Not part of any package |

#### "Unlock All" Feature (per [dashboard1.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/dashboard1.png))
- **"Unlock All" button** in top-left of student dashboard
- On click → **Modal popup** with package/tier details (per [dashboard3.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/dashboard3.png)):
  - **Basic**: Access to core tools (Resume Builder, ATS, Cover Letter)
  - **Pro**: All basic + LinkedIn Analyser + Interview Prep + some credits for Live Interview
  - **Enterprise**: Everything + more credits + priority support
  - **Job Support**: Separate exclusive subscription (standalone purchase)

---

### Component 6: AI-Powered Career Tools (Phase 1)

#### Resume Builder (`/tools/resume-builder`)
3 creation modes per MindSync architecture:
1. **Build from Scratch**: Blank template → guided section-by-section editor
2. **From LinkedIn**: Guide user to download LinkedIn PDF → auto-parse with dedicated LinkedIn parser
3. **From Upload**: Upload existing PDF/DOCX → deterministic parser extracts structured data

**Editor UI**: 3-pane split layout:
- Left: Section navigation rail + resume strength meter
- Center: Accordion form editor with drag-and-drop sections, inline AI rewrite bar (Gemini-powered), auto-resizing textareas
- Right: Live A4 WYSIWYG preview + template switcher + ATS score + export (PDF/DOCX)

**Template System**: 6+ ATS-safe single-column templates (3 free, 3+ premium)
- Row-level A4 pagination with orphan prevention
- Fit-to-one-page auto-scaling

#### ATS Score Checker (`/tools/ats-checker`)
- Upload resume → analyze against ATS algorithms
- Circular gauge score (0-100%)
- Category breakdown: Keyword Density, Section Headers, Formatting, Metrics
- "Fix with AI" CTA linking to resume editor

#### Cover Letter Builder (`/tools/cover-letter`)
- Input: Target role, company, JD, resume data
- AI generates 250-350 word cover letter
- Template matching with resume style
- Editable + export

#### JD Resume Builder / Tailor Resume (`/tools/tailor-resume`)
- Dual input: Resume + Job Description
- AI extracts keywords from JD, compares with resume
- Match percentage + missing keyword visualization
- One-click keyword injection suggestions

#### LinkedIn Profile Analyser (`/tools/linkedin-analyser`)
- Paste LinkedIn profile text/summary
- Score across: Headline, About, Experience, Keywords (0-100 each)
- AI-rewritten headline/summary suggestions
- Copy-to-clipboard optimized text

#### Upload & Enhance (`/tools/upload-enhance`)
- Drag-and-drop resume upload (PDF/DOCX)
- AI parses + identifies weak areas
- Auto-rewrites bullets with action verbs
- Side-by-side before/after review

#### Interview Prep Kit (`/tools/interview-prep`)
- Input: Resume + Target JD
- Generates 20 questions across 5 categories
- STAR-formatted model answers
- Exportable as PDF

---

### Component 7: Design System & Visual Identity

Based on [Theme.png](file:///d:/Product%20Development/NxtGen_Academy/Screenshots/Theme.png) and [DESIGN.md](file:///d:/Product%20Development/NxtGen_Academy/DESIGN.md):

#### Color Palette
| Token | Dark Mode | Light Mode |
|---|---|---|
| `--bg-primary` | `#0a0a0f` (deep dark) | `#fafafa` |
| `--bg-secondary` | `#111118` | `#f5f5f5` |
| `--bg-card` | `#1a1a24` | `#ffffff` |
| `--accent-primary` | `#f5820b` (NxtGen orange) | `#e5720a` |
| `--accent-gradient` | `linear-gradient(135deg, #f5820b, #ff9f43)` | same |
| `--text-primary` | `#ffffff` | `#111111` |
| `--text-secondary` | `#9ca3af` | `#6b7280` |
| `--border-subtle` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` |

#### Typography
- **Primary Font**: Inter (Google Fonts)
- **Display**: Outfit (headings, hero)
- **Monospace**: JetBrains Mono (code, technical content)

#### Motion & Animation (per DESIGN.md)
- Page transitions: `animate-fade-in-up` (200ms)
- Card hover: `scale(1.02)` + border brighten (200ms ease)
- Hero slider: Auto-slide (5s interval) with smooth crossfade
- Dashboard: Fixed sidebar, zero-flash content revalidation
- Scroll animations: Intersection Observer triggered fade-ups

---

### Component 8: Content Protection (Google Drive Integration)

For study materials, recorded sessions, and PDFs:
- **Google Drive API integration** with service account
- **Render-only viewer**: Videos play in embedded player (no download button), PDFs render in custom viewer (disabled right-click, print, download)
- **Watermarking**: Student name + email overlaid on video playback
- **DRM-lite**: Disable browser developer tools shortcuts, prevent screen recording detection (best-effort)
- **Fallback**: Google Viewer iframe for documents with download disabled via Drive API sharing settings

---

## Phased Implementation Roadmap

To eliminate project risk and ensure high-quality software delivery, development is divided into three concrete sub-phases:

### PHASE 1A: Core LMS Engine & Public Platform (Weeks 1–3)
- [ ] Public Website (7 pages + Dark/Light Theme toggle + Fixed Admin-editable Navigation Menu)
- [ ] Decoupled Express REST Backend + Prisma MySQL Database Setup
- [ ] Unified Identity Auth (JWT + Google/GitHub OAuth with automated account linking)
- [ ] Transactional Mailer Service (Resend API for Password Set Links)
- [ ] Admin Dashboard (15 Modules: Users, Batches, Scheduler, Certifications, Menu, Banners, Internships)
- [ ] Student Dashboard (Course Overview, Class Schedule, Protected Google Drive Viewer with Dynamic Watermarking)
- [ ] Certifications Engine (200 Certifications parsed from PDF + "Contact Us" CTA popup modal)

### PHASE 1B: Core AI Tools Suite & Queue Engine (Weeks 4–6)
- [ ] Unified AI Service Provider (`gemini-1.5-flash` primary, `gemini-1.5-pro`, fallback logic)
- [ ] Redis + BullMQ Task Queue for async AI operations (ATS scoring, Cover Letter, JD Tailoring)
- [ ] AWS S3 / Cloudflare R2 Pre-Signed URL Upload Service
- [ ] Hybrid Resume Parser (Deterministic regex + Gemini Vision fallback for complex layouts)
- [ ] Resume Builder Tool (3 modes: Scratch, LinkedIn PDF, Upload + 6 ATS single-column templates + A4 engine)
- [ ] ATS Score Checker, JD Resume Tailor, Cover Letter Builder, LinkedIn Analyser, Interview Prep Kit

### PHASE 2: Advanced Real-Time AI Tools & Hardware Integration (Weeks 7–10)
- [ ] Decoupled Real-Time WebSocket Microservice (Render.com / VPS)
- [ ] **I-Assist (Echo Desktop)**: Speech-to-text live teleprompter with STAR answer co-pilot
- [ ] **Live Interview Prep**: Voice-only mode (`gemini-2.0-flash-exp`) + Full Avatar mode (LiveKit + bitHuman/HeyGen)
- [ ] Production Payment Gateway Integration (Razorpay / Stripe)
- [ ] Android Companion PiP Overlay Application

---

## Verification Plan

### Automated Tests
```bash
# Backend API tests
cd server && npm test

# Frontend component tests
cd client && npm test

# Database migration verification
cd server && npx prisma migrate deploy && npx prisma db seed

# Build verification
cd client && npm run build
cd server && npm run build
```

### Manual Verification
- [ ] All public pages render correctly with dark/light theme toggle
- [ ] Hero slider auto-plays and is responsive
- [ ] Course content matches PDF/image references
- [ ] Login works with Google OAuth + email/password
- [ ] Admin can create users, batches, schedule classes
- [ ] Student sees enrolled courses and can access materials (no download)
- [ ] All 7 career tools function with Gemini AI
- [ ] Resume Builder 3 modes work (scratch, LinkedIn, upload)
- [ ] Certifications page shows all 200 entries from PDF
- [ ] Subscription/unlock modal displays correctly
- [ ] Menu is editable from admin panel
- [ ] Mobile responsive across all pages

---

## Estimated Component Breakdown (Phase 1)

| Component | Files | Complexity |
|---|---|---|
| Project scaffolding & config | ~15 | Low |
| Database schema + migrations + seed | ~10 | Medium |
| Auth system (JWT + OAuth for site users + email service) | ~15 | Medium |
| Public website pages (Home, Courses, Certs, **Internship**, etc.) | ~30 | High |
| Admin Dashboard (**15 modules** incl. Internships + Cert Inquiries) | ~42 | High |
| Student Dashboard (course view + sidebar) | ~20 | High |
| 7 AI Career Tools | ~45 | Very High |
| Design system + theme + animations | ~10 | Medium |
| API routes + controllers | ~35 | High |
| Google Drive integration | ~5 | Medium |
| Redis caching layer | ~3 | Low |
| **Total** | **~230 files** | — |

---

*Next: Upon approval → create task.md checklist → delegate to teamwork agents for parallel development.*
