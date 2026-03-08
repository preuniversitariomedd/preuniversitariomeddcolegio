
-- Per-student session unlock/assignment overrides
CREATE TABLE public.sesiones_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sesion_id uuid NOT NULL REFERENCES public.sesiones(id) ON DELETE CASCADE,
  desbloqueada boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sesion_id)
);

ALTER TABLE public.sesiones_usuarios ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "admin_all_sesiones_usuarios" ON public.sesiones_usuarios
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Students can read their own overrides
CREATE POLICY "own_sesiones_usuarios" ON public.sesiones_usuarios
FOR SELECT USING (user_id = auth.uid());
