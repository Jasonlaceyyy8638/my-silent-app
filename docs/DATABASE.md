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
  file_name text,
  extracted_data jsonb,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- Optional: grant to prisma if you use it for other tools
-- GRANT ALL ON public.documents TO prisma;
```

The app inserts into this table when Supabase is configured. If the table doesn't exist, extraction still works and data is returned to the browser; you'll see a note that cloud save was skipped.

### Session pooler format (reference)

- **User:** `prisma.[project-ref]` (e.g. `prisma.hupsfpzhdrkmvlskqxbg`)
- **Host:** `aws-1-us-east-1.pooler.supabase.com` (region can differ; check Supabase → Connect)
- **Port:** `5432` (Session pooler)
- **Database:** `postgres`
