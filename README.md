# Market Issue Reporting & Ticket Management Tool

A production-ready ticket management system for field sales teams and administrators to report, track, and resolve market issues.

## Overview

This application allows sales staff (ASM, FSE, RSM) to report issues identified in the market with structured categories, impact, and urgency levels. Administrators (HS-ADMIN, PM-ADMIN, CS-ADMIN) can view all tickets, filter and search, update statuses, respond with detailed answers, and manage staff accounts.

## Features

### Authentication
- **Two-step login flow**: Enter corporate email → validate against active staff → enter password
- **No public registration** — all users are preloaded by administrators
- Administrators choose the initial password when creating each user
- Passwords are stored as bcrypt hashes in Supabase Auth, never exposed in the UI

### Standard User Capabilities
- Dashboard with summary cards (Total, Open, In Progress, Pending, Completed, High Urgency)
- Report an Issue with dynamic category/subcategory selection
- View personal ticket history with search and status filter
- View full ticket details with activity timeline
- View administrator responses and status updates

### Admin Capabilities
- Pending Cases Summary Dashboard with statistics
- View all tickets with advanced filters (status, category, subcategory, role, territory, impact, urgency)
- Global search by ticket ID, subject, user name, email, territory
- Update ticket status (Open → In Progress → Pending → Completed)
- Add detailed responses to tickets
- Mark tickets as completed with confirmation
- Staff Management: add, edit, deactivate, reactivate staff
- View pending and completed cases separately

### Ticket System
- Auto-generated ticket numbers: `INC-YYYY-000001`
- 9 categories with 60+ dynamic subcategories
- Impact and urgency levels: Low, Medium, High, Critical
- Full activity timeline tracking all status changes and responses
- Automatic association of reporter info (name, email, role, designation, territory)

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend/Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Authentication**: Supabase Auth (email + password), two-step login flow validated against the staff table
- **Hosting**: Vercel (static SPA)
- **Responsive**: Fully optimized for mobile, tablet, and desktop

## Deploying to Vercel + Supabase

The app is a standard React (Vite) SPA. Supabase provides the database, authentication, and row-level security; Vercel hosts the static frontend.

### Step 1 — Create the Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project** (choose a region close to your users, and save the database password somewhere safe).
2. When the project is ready, open **SQL Editor → New query**, paste the full contents of [`supabase_schema.sql`](./supabase_schema.sql) and click **Run**. This performs a clean destructive reset, then creates:
   - the `staff`, `tickets`, and `ticket_updates` tables,
   - Row Level Security policies (standard users see only their own tickets, admins see all),
   - the helper functions the app calls (`staff_validate_email`, `admin_create_staff`, `admin_update_staff`, `admin_set_staff_active`),
   - race-safe ticket numbering (`INC-YYYY-000001`),
   - the seed users listed below.

### Step 2 — Lock down auth settings (recommended)
1. In the Supabase dashboard go to **Authentication → Sign In / Providers → Email** and disable **Allow new users to sign up** — accounts are created only by administrators (Staff Management page or the seed script).
2. Optional: configure SMTP under **Authentication → Emails** if you want the forgotten-password page to send real emails. Normally, password resets are done by an admin editing a staff member's mobile number, which resets their password to that number.

### Step 3 — Get your Supabase keys
Go to **Project Settings → API** and note:
- **Project URL** → this is `VITE_SUPABASE_URL`
- **anon public key** → this is `VITE_SUPABASE_ANON_KEY`

The anon key is safe to expose in the browser — data access is protected by Row Level Security, never by the key itself.

### Step 4 — Deploy the frontend on Vercel
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New… → Project** → import the repository.
3. Vercel auto-detects Vite (`npm run build`, output `dist`); SPA routing rewrites are already configured in `vercel.json`.
4. Add the two environment variables (for Production, Preview, and Development):
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
5. Click **Deploy**. The app goes live at `https://<your-project>.vercel.app` (add custom domains under **Settings → Domains**).

Or with the Vercel CLI:
```bash
npm i -g vercel
vercel                                   # link the project
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

Do not run [`supabase_migration_admin_password.sql`](./supabase_migration_admin_password.sql) for this setup. It is retained as a legacy reference; rerun [`supabase_schema.sql`](./supabase_schema.sql) when a clean rebuild is required.

### Step 5 — Create the remaining staff accounts
Sign in as an administrator and use **Staff Management** to add users. The administrator chooses each user's initial password. Editing a user's mobile number still resets their password to the new number. Alternatively, add more `seed_staff()` calls at the bottom of `supabase_schema.sql` and re-run them in the SQL editor.

### Local development
```bash
npm install
cp .env.example .env.local    # fill in your Supabase URL + anon key
npm run dev
```

### Migrating existing Base44 data (optional)
Export the Staff / Ticket / TicketUpdate entities from Base44, then follow the notes at the bottom of `supabase_schema.sql` for the import (rows are matched to staff by corporate email, and existing ticket numbers are preserved).

### Differences vs. the Base44 build
- **Email notifications**: Base44 sent status-change emails (`db.integrations.Core.SendEmail`). On this deployment they are logged to the browser console instead. To send real email, deploy a small Supabase Edge Function (e.g. with [Resend](https://resend.com)) and call it from `src/api/db.js`.
- **Ticket numbers** are also generated/validated in the database, so two users reporting an issue at the same time can never collide.
- **Passwords** are bcrypt hashes inside Supabase Auth (`auth.users`) instead of client-side SHA-256 comparisons against the staff table.

### Initial Login (after a clean rebuild)

- `dilan.fernando@universalservice.it` / `Lyca@2026` (HS-ADMIN)

After signing in, use Staff Management to create all other accounts. Public registration remains disabled.

## Database Schema

The application uses three entities:

### Staff
Stores all user accounts with role, designation, contact info, territory, and hashed password.

### Ticket
Stores reported issues with auto-generated ticket numbers, reporter info, category/subcategory, impact/urgency, and status.

### TicketUpdate
Records all ticket activity: creation, status changes, admin responses, and completion — forming the activity timeline.

## Supabase Schema

The complete database setup lives in [`supabase_schema.sql`](./supabase_schema.sql). It includes:
- Table definitions with constraints (`staff`, `tickets`, `ticket_updates`)
- Row Level Security policies keyed on the signed-in Supabase Auth user
- Auto-update `updated_date` triggers and race-safe ticket numbering
- The SQL functions the app calls (login email check + admin staff management)
- Seed data for the initial users and notes for migrating existing Base44 data

## Color Scheme

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#21264e` | Sidebar, headers, primary buttons |
| Background | `#fff7f2` | App background |
| Blue | `#245bc1` | Open status, links |
| Green | `#08dc7d` | Completed status, success |
| Peach | `#ffc8b2` | High urgency |
| Yellow | `#FFDD64` | Pending status, accents |
| Cyan | `#00D7FF` | In Progress status |
| Purple | `#46286E` | Critical impact |

## Security Notes

- Passwords are bcrypt hashes stored in Supabase Auth (`auth.users`); the `staff` table holds profile data only
- Row Level Security enforces data access in the database: standard users can only read their own tickets, admins see everything — this is enforced server-side, not just in the UI
- The `staff` table is not readable before sign-in; the login email check runs through a `SECURITY DEFINER` function that returns only the display name
- Admin-only staff management goes through SQL functions that re-verify the caller's admin role server-side
- Deactivated staff are banned in Supabase Auth and lose all data access
- Staff records use soft-delete (deactivation) to preserve historical ticket data
- Mobile numbers are partially masked in the profile view