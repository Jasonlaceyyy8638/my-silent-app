# Supabase setup for VeloDoc

Use this checklist so credits, Stripe, and (optionally) saved documents all work.

---

## 1. Create a Prisma database user (recommended)

The default `postgres` user can fail with the connection pooler. Create a dedicated user:

1. **Supabase Dashboard** → **SQL Editor** → **New query**
2. Run (replace `YourSecurePassword` with a strong password; avoid `$` and `#`):

```sql
CREATE USER "prisma" WITH PASSWORD 'YourSecurePassword' BYPASSRLS CREATEDB;
GRANT "prisma" TO "postgres";
GRANT USAGE ON SCHEMA public TO prisma;
GRANT CREATE ON SCHEMA public TO prisma;
GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO prisma;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;
```

---

## 2. Get your connection string

1. **Supabase Dashboard** → **Project Settings** → **Database**
2. Under **Connection string** choose **URI** and **Session mode** (port **5432**).
3. Replace the user with `prisma.[your-project-ref]` and the password with the one you set above.

Example (replace project ref and password):

```
postgresql://prisma.XXXXXXXXXX:YourSecurePassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

If the password has `$`, `#`, `@`, or `%`, URL-encode them: `$` → `%24`, `#` → `%23`, `@` → `%40`, `%` → `%25`.

---

## 3. Create the `UserCredits` table (Prisma)

From your project root (with `DATABASE_URL` in `.env`):

```bash
npx prisma db push
```

This creates the `UserCredits` table in your Supabase Postgres database.

---

## 4. Allow the app to read/write credits (RLS)

In **SQL Editor** run:

```sql
ALTER TABLE "UserCredits" DISABLE ROW LEVEL SECURITY;
```

Without this, the app may show 0 credits even when a row exists.

---

## 5. (Optional) Save extractions to Supabase

If you want extracted PDFs stored in Supabase (dashboard “Total Documents Architected” and list to persist):

1. **SQL Editor** run:

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
```

To add org-wide document listing to an existing table: `ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS org_id text;`

2. **Project Settings** → **API**: copy **Project URL** and **service_role** key.
3. In **Netlify** (and local `.env`) set:
   - `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=eyJ...`

If you skip this, extraction and credits still work; only cloud save of documents is disabled.

---

## 6. Netlify environment variables

In **Netlify** → **Site settings** → **Environment variables**, set at least:

| Variable | Where to get it |
|----------|------------------|
| `DATABASE_URL` | Step 2 (Supabase Session pooler with `prisma` user) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard |
| `CLERK_SECRET_KEY` | Clerk Dashboard |
| `OPENAI_API_KEY` | OpenAI API keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook (e.g. for `checkout.session.completed` → `https://velodoc.app/api/webhooks/stripe`) |
| `NEXT_PUBLIC_APP_URL` | `https://velodoc.app` |

Optional (for documents save):

| Variable | Where to get it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |

Redeploy after changing env vars.

---

## Quick checklist

- [ ] Create `prisma` user in Supabase (SQL Editor)
- [ ] Set `DATABASE_URL` (Session pooler, port 5432) in Netlify and `.env`
- [ ] Run `npx prisma db push` (creates `UserCredits`)
- [ ] Run `ALTER TABLE "UserCredits" DISABLE ROW LEVEL SECURITY;`
- [ ] (Optional) Create `documents` table and set Supabase URL + service role key
- [ ] All other env vars set in Netlify (Clerk, OpenAI, Stripe, etc.)
