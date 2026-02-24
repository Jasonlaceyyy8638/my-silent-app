# Prisma + Supabase Postgres

## If you get P1000 (Authentication failed)

Supabase recommends a **dedicated database user for Prisma** instead of the default `postgres` user. The pooler can reject `postgres` while accepting a custom user.

### 1. Create the Prisma user in Supabase

1. In **Supabase Dashboard** go to **SQL Editor** → **New query**.
2. Run this (replace `YourSecurePassword` with a strong password; avoid `$` and `#` to simplify the URL):

```sql
-- Create custom user for Prisma
CREATE USER "prisma" WITH PASSWORD 'YourSecurePassword' BYPASSRLS CREATEDB;

-- Extend prisma's privileges to postgres (so you can see changes in Dashboard)
GRANT "prisma" TO "postgres";

-- Grant permissions on public schema
GRANT USAGE ON SCHEMA public TO prisma;
GRANT CREATE ON SCHEMA public TO prisma;
GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;
```

3. To change the password later:

```sql
ALTER USER "prisma" WITH PASSWORD 'NewPassword';
```

### 2. Update your `.env`

Use the **Session pooler** with the **prisma** user (not `postgres`):

```
DATABASE_URL="postgresql://prisma.hupsfpzhdrkmvlskqxbg:YOUR_PRISMA_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

- Replace `YOUR_PRISMA_PASSWORD` with the password you set in step 1.
- If the password contains `$`, `#`, `@`, or `%`, URL-encode them: `$` → `%24`, `#` → `%23`, `@` → `%40`, `%` → `%25`.

### 3. Allow Prisma to read credits (RLS)

If the app shows 0 credits but the row exists in Supabase (e.g. you see it in SQL Editor), Row Level Security may be blocking the `prisma` role. Run in SQL Editor:

```sql
ALTER TABLE "UserCredits" DISABLE ROW LEVEL SECURITY;
```

(To re-enable later and use a policy instead: `ALTER TABLE "UserCredits" ENABLE ROW LEVEL SECURITY;` then add a policy that allows `prisma` to SELECT/INSERT/UPDATE.)

### 4. Push the schema

```bash
npx prisma db push
```

### 5. Optional: Create the `documents` table (for cloud save of extractions)

If you want extracted PDFs to be saved in Supabase (so they appear in the Table Editor and can be queried), create the `documents` table. In **SQL Editor** run:

```sql
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  org_id text,
  file_name text,
  extracted_data jsonb,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- Optional: grant to prisma if you use it for other tools
-- GRANT ALL ON public.documents TO prisma;
```

If you already have a `documents` table without `org_id`, add it: `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS org_id text;`

The app inserts into this table when Supabase is configured. When the user is in an organization, `org_id` is set so documents can be listed and managed org-wide (Admin/Editor roles). If the table doesn't exist, extraction still works and data is returned to the browser; you'll see a note that cloud save was skipped.

### 6. Optional: documents.updated_at for weekly sync report

For the weekly cron report to filter by “synced in the last 7 days,” add:

```sql
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();
```

The app sets `updated_at` when a document is marked as synced to QuickBooks. If the column is missing, the weekly report falls back to `created_at`.

### 7a. Create the profiles table (required for QuickBooks + 3-tier plans)

If you see `relation "public.profiles" does not exist`, create the table first. Run this in the Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id text PRIMARY KEY,
  qb_access_token text,
  qb_refresh_token text,
  qb_realm_id text,
  email text,
  plan_type text DEFAULT 'starter',
  automation_count integer DEFAULT 0
);

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

- `user_id`: Clerk user ID (unique per user).
- `qb_*`: QuickBooks OAuth tokens and realm; set when the user connects QuickBooks (Pro/Enterprise only).
- `email`: Used as the weekly report recipient for Pro/Enterprise.
- `plan_type`: 'starter' | 'pro' | 'enterprise'. Pro and Enterprise can connect QuickBooks and receive the weekly CSV.
- `automation_count`: Monthly automation usage; reset in your billing cron.

### 7. Optional: profiles.email (if table existed before 7a)

If you already had a `profiles` table without `email`, add it:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
```

Then set `email` on the profile that should receive the report. Otherwise set `WEEKLY_REPORT_EMAIL` in your environment.

### 7b. Subscription tiers: plan_type and automation_count (if table existed before 7a)

If you created `profiles` before adding subscription columns, add them:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'starter';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS automation_count integer DEFAULT 0;
```

- `plan_type`: 'starter' = manual PDF only; 'pro' and 'enterprise' = QuickBooks bridge + weekly CSV report.
- `automation_count`: Tracks monthly automation usage. Reset each billing period in your own job or via Stripe webhook.

### 8. stripe_payments — for Phillip’s Monday morning CSV / weekly report

The Stripe webhook logs each successful payment here so the weekly report (to Phillip at admin@velodoc.app) can include “Payments this week.” Run in SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL,
  user_id text NOT NULL,
  plan text NOT NULL,
  amount_total_cents integer NOT NULL DEFAULT 0,
  customer_email text,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.stripe_payments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_stripe_payments_created_at ON public.stripe_payments(created_at);
```

- `stripe_session_id`: Stripe Checkout Session ID.
- `plan`: 'starter' | 'pro' | 'enterprise'.
- `amount_total_cents`: Session total in cents.
- `customer_email`: From session for reference.

### 9. Optional: api_logs columns for QuickBooks sync troubleshooting

To store failed sync details and show them on the Sync History page (Admin Eye icon), add optional columns to `api_logs`:

```sql
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS document_id text;
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS intuit_tid text;
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS error_message text;
```

### Session pooler format (reference)

- **User:** `prisma.[project-ref]` (e.g. `prisma.hupsfpzhdrkmvlskqxbg`)
- **Host:** `aws-1-us-east-1.pooler.supabase.com` (region can differ; check Supabase → Connect)
- **Port:** `5432` (Session pooler)
- **Database:** `postgres`
