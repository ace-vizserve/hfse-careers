# GEMINI Context: VizServe Career Portal

This document provides essential context, architectural patterns, and development conventions for the VizServe project to guide AI-assisted development.

## 🚀 Project Overview

VizServe is a high-fidelity career portal and job application system built for **HFSE International School** and its associated entities. It functions as a bridge between candidates and the **Manatal Applicant Tracking System (ATS)**.

- **Primary Goal:** Provide a seamless, branded application experience that captures extensive candidate data and syncs it with Manatal.
- **Target Entities:** HFSE International School, HFSE Global Academy, HFSE YoungStarters, HAPI HAUS, HAPI SPACE, Our HAPI Co., and VizSchool.

## 🛠️ Technical Stack

- **Framework:** Next.js 15 (App Router) with Turbopack.
- **Language:** TypeScript (Strict mode).
- **State & Forms:** React Hook Form with Zod validation.
- **Styling:** Tailwind CSS 4, Lucide React icons, and Radix UI primitives.
- **Backend/Integration:** 
  - **Manatal API:** For job retrieval and application submission.
  - **Supabase:** For candidate resume storage (SSR/Client-side).
  - **n8n Webhooks:** For post-submission notifications and data processing.

## 🏗️ Core Architecture & Conventions

### 1. Form Management (`app/jobs/[id]/apply/page.tsx`)
The application form is the project's most complex component. It uses a single large `useForm` instance with a comprehensive Zod schema.
- **Validation Schema:** Defined in `lib/validators/job-application.ts`. Any UI change to form fields **must** be reflected in this schema.
- **Field Mapping:** Manatal uses specific numeric IDs for custom fields (e.g., `1741683` for Resume). These mappings are critical in the submission logic.
- **Dynamic Fields:** Some fields are fetched from the Manatal API via `/api/jobs/[id]/form-fields`.

### 2. API Routes (`app/api/`)
- **`GET /api/jobs`:** Fetches job listings from the Manatal career page API.
- **`POST /api/applications`:** 
  - Validates duplicate applications using `hasAlreadyAppliedToJob`.
  - Normalizes data (HTML formatting for lists like family/references).
  - Converts human-readable values (like Nationality) to Manatal-internal IDs.
  - Submits to Manatal and triggers an n8n webhook.

### 3. Utility Patterns (`lib/utils.ts`)
- **Data Formatting:** Functions like `formatEducations`, `formatExperiences`, and `formatReferencesToHTML` are used to transform flat form data into the specific structures (including raw HTML fragments) expected by the Manatal ATS.
- **Tailwind Merging:** Standard `cn(...)` utility for conditional styling.

### 4. Component Standards
- **UI Components:** Located in `/components/ui/` and `app/components/ui/`.
- **Dropzone:** A custom Supabase-integrated file uploader (`components/dropzone.tsx`).
- **Comboboxes:** Specialized components for Industry and Nationality selection.

## 🛠️ Development Workflow

### Commands
- **Start Development:** `npm run dev`
- **Build Project:** `npm run build`
- **Type Checking:** `tsc --noEmit` (recommended before submission).

### Environment Variables
Ensure the following are configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `MANATAL_API_KEY` / `MANATAL_CLIENT_SLUG`
- `N8N_PROD_WEBHOOK_URL`
- `NEXT_PUBLIC_SITE_URL`

## ⚠️ Critical Constraints

1. **Schema Synchronization:** Never add a field to the application UI without adding it to the `jobApplicationSchema` in `lib/validators/job-application.ts`.
2. **Manatal IDs:** Do not change hardcoded field IDs (e.g., `1741707`, `1741708`) unless explicitly instructed; these correspond to production custom fields in the ATS.
3. **HTML Payloads:** Manatal requires certain multi-entry fields (Family, References, Declarations) as formatted HTML strings. Maintain the existing `<ul>`/`<li>` structure in `lib/utils.ts`.
4. **Duplicate Prevention:** Always use the `hasAlreadyAppliedToJob` utility in submission flows to prevent candidate spam.
