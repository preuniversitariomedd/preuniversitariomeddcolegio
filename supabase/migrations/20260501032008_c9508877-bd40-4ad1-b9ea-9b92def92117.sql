-- Tabla de carreras favoritas por estudiante
CREATE TABLE IF NOT EXISTS public.carreras_favoritas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  carrera_id TEXT NOT NULL,
  notas TEXT NOT NULL DEFAULT '',
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, carrera_id)
);

ALTER TABLE public.carreras_favoritas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_favoritas_select" ON public.carreras_favoritas
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own_favoritas_insert" ON public.carreras_favoritas
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_favoritas_update" ON public.carreras_favoritas
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own_favoritas_delete" ON public.carreras_favoritas
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admin_all_favoritas" ON public.carreras_favoritas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Columna de preferencias de búsqueda de carreras en el perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferencias_carrera JSONB
  NOT NULL DEFAULT '{"ciudades":[],"tipoCosto":"ambas","modalidad":"todas","areas":[]}'::jsonb;