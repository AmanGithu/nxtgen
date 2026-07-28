# Teamwork Project Prompt — Draft

> Status: Step 9 — Assembled & validated, awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Build NxtGen Academy — a production-ready Learning Management System (LMS) and AI-powered career acceleration platform. It's a standalone sub-brand under PAVY focused on education, offering courses in AI, Data Analytics, and Database Administration with integrated AI career tools (Resume Builder, ATS Checker, Interview Prep, LinkedIn Analyser, Cover Letter Builder, JD Tailor). The platform serves 3 user types: Admin (full system control), Student (admin-created, course access + tools), and Site User (self-registered, tool subscriptions).

Working directory: d:\Product Development\NxtGen_Academy
Integrity mode: development
Hosting Target: Decoupled 2-Tier — Vercel static SPA (Frontend) + cPanel Node.js / Render (REST API) + Render / VPS (Real-time WebSockets)
Storage Target: AWS S3 / Cloudflare R2 via Pre-signed Upload URLs
Email Target: Resend API for password set links & notifications
Task Queue: Redis + BullMQ for async AI workloads

## Reference Materials

- Design specifications: `DESIGN.md` and `skill.md` in working directory
- Visual references: All images in `Screenshots/` directory
  - Theme: `Theme.png` (dark bg + orange accent color scheme)
  - Hero slider examples: `1.png`, `2.png`
  - Dashboard structure: `d3.png`, `dashboard1.png`, `dashboard2.png`, `dashboard3.png`
  - Course overview: `course_overview.png`, `couser structure.jpg`
  - Course content images: `data Analyst with AI.png`, `Genertaive AI.png`, `agnetic Ai.png`, `Prompt engineering.png`
  - Tools reference: `tools (1).png`, `tools (2).png`
  - Website layout: `website layout.jpg`
- Course content PDFs in `Screenshots/`: `Data analyst with AI.pdf`, `GENERATIVE AI MASTERCLASS.pdf`, `PYTHON FOR AI PROGRAMMER MASTERCLASS.pdf`, `Python for Developer.pdf`, `Azure MSSQL DBA.pdf`
- Certifications: `Screenshots/certification.pdf` (200 certifications to parse and seed)
- Resume Builder reference project: `D:\Product Development\Resume\MindSync` (3-mode resume builder with AI enhancement)
- Echo Desktop / Interview Assist reference project: `D:\Experiements\Aman\MindSync` (I-Assist live voice teleprompter & co-pilot)
- Pavy website reference: `D:\Product Development\pavy-website` (auth flow, admin dashboard patterns, footer structure, UI skills)

## Requirements

### R1. Public Website with Full-Width Hero Slider, Course Catalog, Internship Hub & Certifications

Build a public-facing website with 8 pages: Home (hero carousel slider with text+image split layout, course tiles, certification highlights, internship highlights, tools slider, corporate section, footer), Courses (tabbed by technology — AI default with 5 courses, Database Admin with 4 courses matching Azure MSSQL DBA structure), Certifications (200 tiles from certification.pdf with name/provider/prerequisite and "Contact Us" CTA popup modal), Internship (dedicated page for Generative AI & Agentic AI programs with featured projects: *Build an AI Call Center with LiveKit* and *Make Your Own AI Receptionist with ElevenLabs Conversational AI*), Tools (dropdown menu with 8 tool pages), Upcoming Batches (admin-configurable list), Corporate (first 3 AI courses, admin-configurable), and Login (Google OAuth + GitHub OAuth for Site Users, Email/Password for admin-created Students). Navigation menu must be fixed and admin-editable.

### R2. Admin Dashboard with Batch Management, User Control, and Content Configuration

Build an admin dashboard with fixed left sidebar (per d3.png structure) containing: Overview with KPIs, User Management (create users, assign roles ADMIN/STUDENT/SITE_USER, send credentials), Batch Configuration (create batch, add students, link course/certifications, set Google Drive folder for recordings), Class Scheduler (select batch → enter date/time/Zoom link, calendar + list views), Upcoming Batches CRUD, Corporate Courses config, Study Materials management (per batch — notes/recordings/assignments/quizzes via Drive links), Certifications CRUD (soft-delete with isActive flag), Menu Editor, Hero Banner manager, Resume Template management (upload snapshot → AI generates template → approve → add to free/premium library), AI Config (Gemini primary/fallback model settings), and Audit Logs.

### R3. Student Dashboard with Course Progress, Protected Content Viewing, and Subscription-Gated Tools

Build a student dashboard showing enrolled course tiles. On course click, open a course view with collapsible left sidebar (Gemini/ChatGPT style) containing: Overview (progress donut chart, module bars, upcoming classes — per course_overview.png), Study Material (horizontal tabs — Study Material/Class Notes/Recorded Sessions/Assignments/Quizzes, content rendered from admin-configured Google Drive — videos play inline with NO download, PDFs render inline with NO download), Class Schedule (scheduled classes with Zoom links from admin), Certifications (course-specific only), and 7 subscription-locked tool links (Resume Builder, Cover Letter, Tailor Resume, LinkedIn Analyser, ATS Checker, Interview Prep, Live Interview Prep). Include "Unlock All" button showing tier-based package popup (per dashboard3.png). Job Support is a separate exclusive subscription not in any package.

### R4. Eight AI-Powered Career Tools with Gemini Integration & BullMQ Queue

Build 8 functional AI career tools using Google Gemini API (`gemini-1.5-flash` primary, `gemini-1.5-pro` fallback, `gemini-2.0-flash-exp` voice) managed via a Redis + BullMQ async task queue:
1. **Resume Builder** — 3 modes: build from scratch (blank template → guided editor), from LinkedIn (detect LinkedIn PDF → dedicated parser), from upload (hybrid regex + Gemini Vision fallback parser). 3-pane editor UI: left nav rail + center form with drag-and-drop sections + right live A4 preview. 6+ ATS-safe templates (free/premium). Row-level A4 pagination. AI inline bullet rewriting. PDF/DOCX export.
2. **Upload & Enhance** — drag-drop upload → hybrid AI parse + identify weak areas → auto-rewrite with action verbs → side-by-side review.
3. **ATS Score Checker** — circular gauge (0-100%) + category breakdown + "Fix with AI" CTA (queued worker task).
4. **JD Resume Builder / Tailor Resume** — dual input (resume + JD) → keyword match % → missing keyword visualization → one-click injection.
5. **Cover Letter Builder** — input role/company/JD → AI generates 250-350 word letter → template-matched styling → export.
6. **LinkedIn Profile Analyser** — paste profile text → score Headline/About/Experience/Keywords → AI-rewritten suggestions → copy-to-clipboard.
7. **Interview Prep Kit** — input resume + JD → 20 questions across 5 categories → STAR-format model answers → PDF export.
8. **I-Assist (Echo Desktop)** — real-time speech teleprompter & AI interview co-pilot listening to interviewer questions via WebSockets, transcribing audio, and rendering instant STAR-structured candidate hints based on candidate resume background.

### R5. Design System with Dark/Light Adaptive Theme and Motion Architecture

Implement a design system based on Theme.png: deep dark background (#0a0a0f) with NxtGen orange accent (#f5820b) as default, with user-toggleable dark/light mode. Use Tailwind CSS v4 for layout utilities + custom CSS for complex animations. Typography: Inter (body), Outfit (headings). Motion: page fade-in-up transitions (200ms), card hover scale(1.02) + border brighten, hero auto-slider (5s), scroll-triggered animations via Intersection Observer. Dashboard: fixed sidebar with zero-flash content. All components use glassmorphism cards with subtle borders and soft shadows.

## Acceptance Criteria

### Public Website
- [ ] Home page loads with auto-playing hero carousel (3+ slides, text+image split, 5s interval)
- [ ] All 7 navigation links work and menu is fixed/sticky
- [ ] Courses page shows AI tab (5 courses) and Database tab (4 courses) with real content from PDFs
- [ ] Certifications page displays 200+ entries parsed from certification.pdf with working search/filter
- [ ] Tools dropdown in nav shows 7 tool links, each routing to a functional tool page
- [ ] Dark/light theme toggle persists across page navigation
- [ ] All pages are mobile-responsive (breakpoints: 640px, 768px, 1024px, 1280px)

### Authentication & Authorization
- [ ] Google OAuth login creates user session and redirects to role-based dashboard
- [ ] GitHub OAuth login works identically to Google
- [ ] Email/password login works for admin-created accounts
- [ ] Unauthenticated users cannot access any `/dashboard/*` routes
- [ ] Role-based routing: ADMIN → admin dashboard, STUDENT → student dashboard, SITE_USER → tools dashboard

### Admin Dashboard
- [ ] Admin can create a new user with email/role and generated password
- [ ] Admin can create a batch, assign students, link a Google Drive folder
- [ ] Admin can schedule a class with date/time/Zoom link visible to students
- [ ] Admin can CRUD upcoming batches and corporate courses
- [ ] Admin can add/edit/soft-delete certifications
- [ ] Admin can edit navigation menu items and reorder them
- [ ] Admin can manage hero banner slides (add/edit/delete/reorder)
- [ ] Gemini model configuration (primary + fallback) saves and is used by AI tools

### Student Dashboard
- [ ] Student sees only their enrolled courses
- [ ] Course overview shows progress donut chart with module-level progress bars
- [ ] Study materials render from Google Drive without any download option
- [ ] Class schedule shows upcoming classes with clickable Zoom links
- [ ] Locked tools show lock icon and "Unlock All" button opens pricing modal
- [ ] Subscription tier selection updates user access level (mock payment)

### AI Career Tools
- [ ] Resume Builder: all 3 creation modes produce a structured resume
- [ ] Resume editor live preview updates in real-time as user types
- [ ] ATS Score Checker returns a score between 0-100 with category breakdown
- [ ] Cover Letter Builder generates coherent, job-specific cover letters
- [ ] JD Tailor shows keyword match percentage and highlights missing keywords
- [ ] LinkedIn Analyser scores profile across 4 dimensions with AI suggestions
- [ ] Interview Prep generates 20 relevant questions with STAR-format answers
- [ ] All AI tools use Gemini API and gracefully handle API errors

### Database & Backend
- [ ] Prisma schema has all required models and relationships
- [ ] Database seeds successfully with course data from PDFs and 200 certifications
- [ ] All API endpoints return proper error codes (400, 401, 403, 404, 500)
- [ ] JWT authentication middleware protects all dashboard API routes

### Design & Performance
- [ ] Theme matches Theme.png color scheme (dark bg #0a0a0f, orange accent #f5820b)
- [ ] Page transitions animate with fade-in-up effect
- [ ] Card hover states include scale and border animation
- [ ] Lighthouse performance score ≥ 80 on home page
- [ ] No layout shift (CLS < 0.1) during page load

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*
