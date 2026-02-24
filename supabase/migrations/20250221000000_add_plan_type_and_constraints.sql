-- Migration: Add plan_type to profiles with enum constraint; add plan_change_log for admin visibility.
-- Run in Supabase SQL Editor or via Supabase CLI.

-- 1. Add plan_type column to profiles if it does not exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'starter';

-- 2. Enum constraint: plan_type only accepts 'starter', 'pro', or 'enterprise'
-- Drop existing constraint if re-running (constraint name must be unique)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_type_check
  CHECK (plan_type IN ('starter', 'pro', 'enterprise'));

-- 3. Optional: backfill existing rows to satisfy constraint (if any had other values)
UPDATE public.profiles
SET plan_type = 'starter'
WHERE plan_type IS NULL OR plan_type NOT IN ('starter', 'pro', 'enterprise');

-- 4. plan_change_log: for Phillip McKenzie's admin view when pro/enterprise is set
CREATE TABLE IF NOT EXISTS public.plan_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  customer_email text,
  from_plan text,
  to_plan text NOT NULL,
  stripe_session_id text,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.plan_change_log DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_plan_change_log_created_at
  ON public.plan_change_log(created_at DESC);

COMMENT ON TABLE public.plan_change_log IS 'Logs plan upgrades to pro/enterprise for admin visibility (Phillip McKenzie).';
