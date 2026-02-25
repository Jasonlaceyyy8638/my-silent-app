-- Credit reimbursement audit log: one row per admin credit adjustment (reimburse).
-- Used by /admin Reimburse tool; admin-only access.
CREATE TABLE IF NOT EXISTS public.credit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  credits_added int NOT NULL CHECK (credits_added > 0),
  reason text NOT NULL,
  performed_by text NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.credit_logs IS 'Audit log for admin credit reimbursements; performed_by is admin email.';
CREATE INDEX IF NOT EXISTS idx_credit_logs_user_id ON public.credit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_logs_created_at ON public.credit_logs(created_at DESC);
ALTER TABLE public.credit_logs DISABLE ROW LEVEL SECURITY;
