-- Add stripe_customer_id to profiles for Stripe Customer Portal (billing portal sessions).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe Customer ID (cus_*) for billing portal and subscription updates.';
