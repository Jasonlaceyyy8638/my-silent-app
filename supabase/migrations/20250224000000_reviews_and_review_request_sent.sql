-- Reviews table + review_request_sent on profiles (so we don't email them again after they submit a review).
-- =============================================================================

-- 1. reviews: user_id, rating (1-5), comment (testimonial text), is_published, reviewer_name (optional display name)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  reviewer_name text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.reviews IS 'User reviews/testimonials; is_published controls visibility on landing page.';
CREATE INDEX IF NOT EXISTS idx_reviews_is_published_created_at ON public.reviews(is_published, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- 2. profiles: add review_request_sent so we don't send the review-request email again after they submit
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS review_request_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.review_request_sent IS 'Set to true after user submits a review so they are not emailed again.';

-- 3. Update trigger to skip queueing if user already submitted a review (review_request_sent = true)
CREATE OR REPLACE FUNCTION public.on_sync_history_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
  v_email text;
  v_review_request_sent boolean;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.sync_history
  WHERE user_id = NEW.user_id;

  IF v_count <> 10 THEN
    RETURN NEW;
  END IF;

  SELECT p.email, COALESCE(p.review_request_sent, false) INTO v_email, v_review_request_sent
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id
  LIMIT 1;

  IF v_review_request_sent OR v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.review_request_queue (user_id, email)
  VALUES (NEW.user_id, v_email)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
