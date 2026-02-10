# Training Planner

Training Planner is a modern web application for planning, tracking, and reflecting on training sessions. It is designed for athletes and individuals who want a clear overview of their workouts, weekly structure, and long-term progress — with a strong focus on usability, performance, and clean architecture.

The project is built as a **full‑stack, production‑ready application**, combining a polished UI with a secure backend and scalable data model.

---

##  Features

*  **Weekly training planning** – plan sessions by week with a clear visual overview
*  **Completed sessions tracking** – mark sessions as completed and review past training
*  **Reusable templates** – create and reuse training templates
*  **Insights & logs** – analyze training volume and consistency over time
*  **Authentication** – secure sign‑in with Supabase Auth (magic links)
*  **Row Level Security (RLS)** – strict user‑based data access
*  **Responsive design** – optimized for desktop and mobile

---

##  Tech Stack

### Frontend

* **Next.js (App Router)**
* **TypeScript**
* **Tailwind CSS**
* **React Server & Client Components**

### Backend

* **Supabase**

    * PostgreSQL database
    * Supabase Auth (magic link authentication)
    * Row Level Security (RLS)
    * Performance‑optimized policies and indexes

### Tooling & Quality

* ESLint + TypeScript strict mode
* Performance Advisor clean‑up (indexes, RLS optimization)
* Modular, maintainable folder structure

---

##  Architecture Overview

The app follows a clean separation of concerns:

* **UI Layer** – pages, layouts, and components built with the Next.js App Router
* **Data Layer** – Supabase tables (`planned_sessions`, `completed_sessions`, `templates`, `user_settings`)
* **Auth Layer** – Supabase Auth with server‑side session handling
* **Security Layer** – Row Level Security policies scoped to authenticated users

Each user can only access their own data, enforced at the database level.

---

##  Security & RLS

All user‑owned tables use a single optimized **ALL** RLS policy:

* Access restricted to `authenticated` users
* Policies based on `user_id = auth.uid()`
* Optimized using `(select auth.uid())` to avoid per‑row re‑evaluation

This ensures:

* Strong data isolation
* Predictable behavior
* Good performance at scale

---

##  Database Tables

* **planned_sessions** – future and scheduled training sessions
* **completed_sessions** – logged and completed sessions
* **templates** – reusable session templates
* **user_settings** – per‑user preferences

Foreign keys and indexes are explicitly defined to support efficient queries and joins.

---

##  Getting Started

### Prerequisites

* Node.js (18+ recommended)
* A Supabase project

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_default_key
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Branding

Training Planner uses a clean, minimal visual identity:

* Primary accent color: **Green** (progress, health, consistency)
* Custom calendar/check logo
* Neutral UI palette for long‑term usability

The same branding is used consistently across the app UI and transactional emails.
