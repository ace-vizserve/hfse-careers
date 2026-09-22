# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev             # Start dev server (Next.js + Turbopack)
npm run build           # Production build
npm run start           # Start production server
tsc --noEmit            # Type-check without emitting (no lint script configured)

npm run test:e2e        # Playwright, all five browser targets
npm run test:e2e:safari # WebKit + mobile Safari only
npm run test:e2e:ui     # Playwright UI mode, for stepping through
npm run browser:safari  # Open a headed browser to click around yourself
```

Tests live in `e2e/` and run against a stubbed Manatal and Supabase on port
5000, so a run never creates a candidate or uploads a file. `e2e/README.md`
covers what each spec guards and what WebKit does and does not tell you about
real Safari.

## Architecture

Next.js 15 App Router (TypeScript strict) career portal for HFSE International School. Bridges candidates with the **Manatal ATS** for job discovery and application submission.

**Rendering:** SSR for job listing/detail pages (SEO), client-side for the application form.

**External integrations:**
- **Manatal API** (`https://api.manatal.com/open/v3`) — job listings, application submission, candidate/nationality lookup. Auth via `Authorization: Token {MANATAL_API_KEY}`.
- **Supabase** — file storage for resume uploads.
- **n8n Webhooks** — post-submission notifications.

**Key routes:**
- `/` — Job listings (SSR, `app/jobs-client.tsx`)
- `/jobs/[id]` — Job detail page
- `/jobs/[id]/apply` — Multi-step application form (most complex component)
- `/embed/jobs` — Embeddable iframe widget with CSP headers and `postMessage` resize
- `/api/applications` — POST: validates, deduplicates, submits to Manatal, triggers n8n
- `/api/nationalities/[search]` — GET: proxies Manatal nationality autocomplete

**UI stack:** Tailwind CSS 4, Radix UI primitives, Shadcn component conventions (`components/ui/`), Lucide icons, Embla Carousel, Sileo toasts.

## Key Patterns

**Form management** (`app/jobs/[id]/apply/page.tsx`): Single `useForm` instance backed by a comprehensive Zod schema in `lib/validators/job-application.ts`. Any UI form field change **must** be reflected in this schema.

**Manatal field IDs:** Hardcoded numeric IDs (e.g., `1741683` for Resume, `1742127` for Nationality) map form fields to Manatal custom fields. Do not change these without explicit instruction.

**HTML payloads:** Multi-entry fields (Family Particulars, References, Declarations) are formatted as HTML strings (`<ol><li><ul>` structure) via helpers in `lib/utils.ts` (`formatReferencesToHTML`, `formatFamilyParticularsToHTML`, `generateDeclarationList`).

**Duplicate prevention:** `hasAlreadyAppliedToJob()` in `lib/utils.ts` checks Manatal for existing candidates by email or name before submission.

**Data formatting:** `formatEducations()` and `formatExperiences()` in `lib/utils.ts` transform form arrays into Manatal-expected payloads.

**File uploads:** `useSupabaseUpload` hook (`hooks/use-supabase-upload.ts`) wraps Supabase storage with drag-drop via react-dropzone.

## Environment Variables

Required in `.env.local`:
- `MANATAL_API_KEY`, `MANATAL_CLIENT_SLUG` — Manatal API access (server-only)
- `NEXT_PUBLIC_MANATAL_API_KEY` — Client-side Manatal access
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase config
- `N8N_PROD_WEBHOOK_URL` — Post-submission webhook
- `ALLOWED_PARENT_DOMAINS` — CSP for embed iframe
- `NEXT_PUBLIC_SITE_URL` — Canonical site URL
