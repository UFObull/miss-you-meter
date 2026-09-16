-- Single shared row holding both people's miss counts.
CREATE TABLE IF NOT EXISTS public.miss_counts (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  liam_count integer NOT NULL DEFAULT 0,
  hope_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the single row if it doesn't exist.
INSERT INTO public.miss_counts (id, liam_count, hope_count)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Grants: public read (anon), service role full access.
GRANT SELECT ON public.miss_counts TO anon;
GRANT SELECT ON public.miss_counts TO authenticated;
GRANT ALL ON public.miss_counts TO service_role;

-- Enable Row Level Security with a permissive public read policy.
ALTER TABLE public.miss_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "miss_counts public read" ON public.miss_counts;
CREATE POLICY "miss_counts public read"
  ON public.miss_counts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Atomic increment that bumps exactly one counter and returns both new totals.
-- Security definer so anonymous taps can bump counts without UPDATE grants.
CREATE OR REPLACE FUNCTION public.increment_count(which text)
RETURNS TABLE (liam_count integer, hope_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.miss_counts
  SET liam_count = liam_count + CASE WHEN which = 'liam' THEN 1 ELSE 0 END,
      hope_count = hope_count + CASE WHEN which = 'hope' THEN 1 ELSE 0 END,
      updated_at = now()
  WHERE id = 1
  RETURNING liam_count, hope_count;
$$;

-- Allow anyone to call the increment RPC.
GRANT EXECUTE ON FUNCTION public.increment_count(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_count(text) TO authenticated;

-- Live updates: broadcast row changes to subscribers.
ALTER PUBLICATION supabase_realtime ADD TABLE public.miss_counts;