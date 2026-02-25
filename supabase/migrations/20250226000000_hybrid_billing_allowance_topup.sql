-- Hybrid Billing: monthly allowance (consumed first) + purchased top-up credits.
-- Priority: use credits_allowance_remaining first, then credits_topup_remaining.
-- invoice.paid resets credits_allowance_remaining; top-up purchases add to credits_topup_remaining.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_allowance_remaining int NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_topup_remaining int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.credits_allowance_remaining IS 'Monthly allowance (reset on invoice.paid); consumed before credits_topup_remaining.';
COMMENT ON COLUMN public.profiles.credits_topup_remaining IS 'Purchased top-up credits; consumed after allowance hits zero.';

-- Backfill: treat existing credits_remaining as allowance so behavior is unchanged until next invoice.
UPDATE public.profiles
SET
  credits_allowance_remaining = GREATEST(0, COALESCE(credits_remaining, 0)),
  credits_topup_remaining = 0
WHERE credits_allowance_remaining = 0 AND credits_topup_remaining = 0;
