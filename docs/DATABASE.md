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

### 3. Push the schema

```bash
npx prisma db push
```

### Session pooler format (reference)

- **User:** `prisma.[project-ref]` (e.g. `prisma.hupsfpzhdrkmvlskqxbg`)
- **Host:** `aws-1-us-east-1.pooler.supabase.com` (region can differ; check Supabase → Connect)
- **Port:** `5432` (Session pooler)
- **Database:** `postgres`
