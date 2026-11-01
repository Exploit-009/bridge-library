ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS study_goal_target integer,
  ADD COLUMN IF NOT EXISTS study_goal_text text,
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('message','problem','feedback','chat')),
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  rating integer CHECK (rating BETWEEN 1 AND 5),
  page text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(subject) <= 200 AND length(message) <= 5000)
);
GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users send own requests" ON public.support_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'open');
CREATE POLICY "users read own requests" ON public.support_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update requests" ON public.support_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER touch_support_requests BEFORE UPDATE ON public.support_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();