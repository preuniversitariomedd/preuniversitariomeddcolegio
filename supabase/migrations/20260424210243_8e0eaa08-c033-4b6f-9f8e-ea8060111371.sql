CREATE TABLE public.orientacion_vocacional (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  top_carreras JSONB NOT NULL DEFAULT '[]'::jsonb,
  carrera_elegida TEXT,
  perfil_normalizado JSONB NOT NULL DEFAULT '{}'::jsonb,
  tests_usados INTEGER NOT NULL DEFAULT 0,
  fecha_calculo TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_revision TIMESTAMPTZ
);

ALTER TABLE public.orientacion_vocacional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_orientacion_select" ON public.orientacion_vocacional
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_orientacion_insert" ON public.orientacion_vocacional
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_orientacion_update" ON public.orientacion_vocacional
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "own_orientacion_delete" ON public.orientacion_vocacional
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "admin_all_orientacion" ON public.orientacion_vocacional
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));