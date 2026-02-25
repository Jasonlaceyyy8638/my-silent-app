-- Low Credit Watchdog: only send "Low Fuel" email once per low-balance period.
-- Reset when user tops up (Stripe or admin).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS low_credit_alert_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.low_credit_alert_sent IS 'Set true after sending low-credit email; reset to false when user adds credits (Stripe or admin).';
