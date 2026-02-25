-- sync_history: one row per successful QuickBooks sync (app inserts here on each sync).
-- When a user reaches exactly 10 successful syncs, we queue a review-request email (sales@velodoc.app).
-- =============================================================================

-- 1. sync_history table (app inserts from quickbooks-sync.ts on success)
CREATE TABLE IF NOT EXISTS public.sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  document_id uuid NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.sync_history IS 'One row per successful QuickBooks sync; trigger at 10 syncs queues review-request email.';
CREATE INDEX IF NOT EXISTS idx_sync_history_user_id ON public.sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_created_at ON public.sync_history(created_at DESC);
ALTER TABLE public.sync_history DISABLE ROW LEVEL SECURITY;

-- 2. review_request_queue: one row per user when they hit 10 syncs (webhook sends email, then marks sent_at)
CREATE TABLE IF NOT EXISTS public.review_request_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  sent_at timestamptz
);

COMMENT ON TABLE public.review_request_queue IS 'Queued review-request emails; Supabase webhook calls app to send via SendGrid from sales@velodoc.app.';
CREATE INDEX IF NOT EXISTS idx_review_request_queue_sent_at ON public.review_request_queue(sent_at) WHERE sent_at IS NULL;
ALTER TABLE public.review_request_queue DISABLE ROW LEVEL SECURITY;

-- 3. Trigger function: when sync_history gets a new row, if this user now has exactly 10 syncs, queue one review request (idempotent per user)
CREATE OR REPLACE FUNCTION public.on_sync_history_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
  v_email text;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.sync_history
  WHERE user_id = NEW.user_id;

  IF v_count <> 10 THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_email
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.review_request_queue (user_id, email)
  VALUES (NEW.user_id, v_email)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Trigger on sync_history
DROP TRIGGER IF EXISTS tr_sync_history_review_request ON public.sync_history;
CREATE TRIGGER tr_sync_history_review_request
  AFTER INSERT ON public.sync_history
  FOR EACH ROW
  EXECUTE FUNCTION public.on_sync_history_after_insert();
