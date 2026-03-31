# VizServe Career Portal

VizServe is a centralized career portal and job application platform designed for **HFSE International School** and its associated entities. It streamlines the recruitment process by providing a modern, user-friendly interface for candidates to discover opportunities and submit comprehensive applications.

## 🚀 Project Overview

This platform serves as the primary recruitment hub for several organizations, including:
- HFSE International School
- HFSE Global Academy
- HFSE YoungStarters
- HAPI HAUS & HAPI SPACE
- Our HAPI Co.
- VizSchool

## ✨ Key Features

- **Job Discovery:** Browse, search, and filter job listings by location, employment type (Full-Time, Part-Time, Contract), and remote availability.
- **Detailed Job Insights:** Comprehensive view of job descriptions, qualifications, responsibilities, and benefits.
- **Advanced Application System:** A multi-step, robust application form capturing:
  - Personal details and identification (NRIC/FIN validation).
  - Educational history and academic profiles.
  - Detailed employment history and professional experience.
  - Family particulars and emergency contact information.
  - Specialized tracks for Teacher positions and Foreign applicants (Work Pass details).
  - Character references and mandatory legal/medical declarations.
- **Secure Document Upload:** Integrated resume upload powered by Supabase storage.
- **Real-time Validation:** Client-side form validation using Zod for a seamless user experience.

## 🛠️ Technical Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Forms:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Backend/Storage:** [Supabase](https://supabase.com/) (SSR & Storage)
- **UI Components:** [Radix UI](https://www.radix-ui.com/), Custom Headless Components

## 📦 Getting Started

### Prerequisites

- Node.js 20+ 
- npm / yarn / pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd our-vizserve
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add your Supabase and Site URL configuration:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Architecture

- `/app`: Contains all pages, API routes, and core client/server components.
- `/components`: Reusable UI components (Dropzone, Button, Comboboxes, etc.).
- `/lib`: Utility functions, shared validators (Zod schemas), and API clients.
- `/hooks`: Custom React hooks for file uploads and lifecycle management.
- `/public`: Static assets, logos, and global images.

## 📄 License

This project is private and proprietary.
