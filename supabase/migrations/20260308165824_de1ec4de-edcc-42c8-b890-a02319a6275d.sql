
CREATE TABLE public.presencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen timestamptz NOT NULL DEFAULT now(),
  dispositivo text,
  ip text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.presencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_presencia" ON public.presencia FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "own_presencia_select" ON public.presencia FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_presencia_upsert" ON public.presencia FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_presencia_update" ON public.presencia FOR UPDATE TO authenticated USING (user_id = auth.uid());
