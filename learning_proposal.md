# Learning Proposal — NxtGen Academy Project Rules

## Context

During the NxtGen Academy planning session, several critical design decisions and constraints were established through the user interview. These should be persisted as project-scoped rules to prevent future agents from making incorrect assumptions.

## Classification: Project-Scoped Rules

All items below are **Rules** (not Skills) because they are behavioral constraints and design decisions specific to this workspace.

**Scope**: Workspace-level — append to `.agents/AGENTS.md` in the NxtGen Academy project root.

---

## Proposed Rules

### Rule 1: NxtGen Academy Tech Stack Constraints
```markdown
## NxtGen Academy Tech Stack
- **Frontend**: Vite + React 19 (TypeScript) — SPA architecture on Vercel CDN with code splitting & prefetching
- **REST Backend**: Node.js + Express.js (TypeScript) on cPanel Node.js App or Render.com
- **Real-Time Backend**: Dedicated Node.js WebSocket Service on Render.com / VPS for I-Assist teleprompter & Gemini Live Audio
- **Database**: MariaDB/MySQL via Prisma ORM (port 3306, locally running or cPanel MySQL)
- **Styling**: Tailwind CSS v4 for layout + Custom CSS for animations + Dynamic Canvas Watermarking
- **AI Provider**: Google Gemini API via Unified AI Service — Primary: `gemini-1.5-flash` / `gemini-1.5-pro`, Fallback: `gemini-1.5-flash`, Voice: `gemini-2.0-flash-exp` (env-driven)
- **Task Queue**: Redis + BullMQ for async AI workloads (ATS scoring, Cover Letter, Tailoring)
- **Auth**: Unified User Identity by email; Admin invites via Resend mailer (password set links); Google/GitHub OAuth for Site Users with automated account linking
- **File Storage**: S3-compatible cloud storage (AWS S3 / Cloudflare R2) via Pre-signed Upload URLs
- **Google Drive API**: Access-controlled viewer with dynamic canvas student email/IP watermark overlay
- **Payment**: Mock payments (Phase 1), real gateway integration in Phase 2
```

**Rationale**: The user explicitly chose Vite+React over Next.js, and Gemini-only AI over OpenAI. These decisions must be respected by all future agents.

---

### Rule 2: NxtGen Academy Branding & Theme
```markdown
## NxtGen Academy Branding
- **Relationship**: Sub-brand under PAVY, focused exclusively on education
- **Domain**: nxtgen.pavy.ai (standalone platform)
- **Routing**: Clicking courses/explore on Pavy's /academy redirects to nxtgen.pavy.ai
- **Theme Default**: Dark mode — deep dark background (#0a0a0f), NxtGen orange accent (#f5820b)
- **Theme Toggle**: Dark/Light adaptive mode — user can toggle
- **Typography**: Inter (body), Outfit (headings), JetBrains Mono (code)
- **Footer**: "Powered by PAVY" dual branding
```

**Rationale**: The user clarified that NxtGen Academy is NOT a standalone brand nor simply a PAVY section — it's a dual-branded sub-entity with its own domain.

---

### Rule 3: Content Protection Requirements
```markdown
## Content Protection
- Study materials (videos, PDFs, presentations) from Google Drive MUST be render-only
- Students can watch videos but CANNOT download them
- Students can view PDFs/presentations inline but CANNOT download them
- Prevent downloading by any means (disable right-click context menu, disable browser download buttons, use embedded viewers)
- Admin configures Google Drive folder once per batch — all folder contents auto-populate
```

**Rationale**: This is a hard business requirement for protecting copyrighted educational content.

---

### Rule 4: Subscription & Monetization Model
```markdown
## Subscription Model
- **Freemium**: Basic tool access free, premium features behind paywall
- **Subscription Tiers**: Basic/Pro/Enterprise for tool access (paywall)
- **Credit-Based**: Live Interview Prep and I-Assist (Echo Desktop) use credits, not subscription
- **Premium Packages**: Include some credits for credit-based tools
- **Job Support**: EXCLUSIVE separate subscription — NOT part of any package, standalone purchase
- **Resume Templates**: Free templates available to all; Premium templates require subscription
- **Eight Career Tools**: Resume Builder, Upload & Enhance, ATS Checker, JD Tailor, Cover Letter Builder, LinkedIn Profile Analyser, Interview Prep Kit, I-Assist (Echo Desktop)
- **Phase 1**: Mock payments only
```,StartLine:45,TargetContent:

**Rationale**: Complex hybrid monetization model that mixes subscription tiers with credit-based usage for expensive AI features.

---

### Rule 5: User Management & Authentication Model
```markdown
## User Types & Auth Rules
- **Admin**: Full system control, can create users, assign roles
- **Student**: Created by Admin ONLY (no self-signup), receives credentials via email
- **Site User**: Can self-register for tool subscriptions
- Admin sends ID/password to students — students do NOT sign up themselves
- OAuth (Google/GitHub) available for all user types
- Role-based routing: Admin → /dashboard/admin, Student → /dashboard/student, Site User → /dashboard/tools
```

**Rationale**: Critical security and business constraint — students cannot self-register; only admin-provisioned accounts.

---

## Implementation

If approved, I will append these 5 rules to:
```
d:\Product Development\NxtGen_Academy\.agents\AGENTS.md
```

This will NOT overwrite the existing Next.js agent rules — it will append below them. The existing rule about Next.js docs will remain but is noted as not applicable (since we're using Vite+React).

---

*Awaiting user approval before making any changes.*
