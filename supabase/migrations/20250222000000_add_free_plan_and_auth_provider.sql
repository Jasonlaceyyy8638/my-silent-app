-- Add plan_type 'free' and auth_provider for admin visibility (Google vs Email).
-- Run in Supabase SQL Editor or via Supabase CLI.

-- 1. Add auth_provider column to profiles (Google, Email, etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_provider text;

-- 2. Extend plan_type constraint to include 'free'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_type_check
  CHECK (plan_type IN ('starter', 'pro', 'enterprise', 'free'));

-- 3. Optional: backfill auth_provider for existing rows (default Email for legacy)
-- UPDATE public.profiles SET auth_provider = 'Email' WHERE auth_provider IS NULL;

COMMENT ON COLUMN public.profiles.auth_provider IS 'Auth provider for admin visibility: Google, Email, etc.';
