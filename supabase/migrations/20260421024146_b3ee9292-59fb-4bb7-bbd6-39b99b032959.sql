-- Tabla de resultados de tests psicométricos
CREATE TABLE public.resultados_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  puntaje_total NUMERIC,
  puntaje_por_subescala JSONB,
  interpretacion TEXT CHECK (interpretacion IN ('bajo','medio','alto')),
  tiempo_real_segundos INTEGER,
  completado BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_resultados_tests_user ON public.resultados_tests(user_id);
CREATE INDEX idx_resultados_tests_test ON public.resultados_tests(test_id);

ALTER TABLE public.resultados_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_resultados_tests_select" ON public.resultados_tests
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_resultados_tests_insert" ON public.resultados_tests
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_resultados_tests_update" ON public.resultados_tests
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "admin_all_resultados_tests" ON public.resultados_tests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tabla de resultados de ejercicios de concentración
CREATE TABLE public.resultados_ejercicios_concentracion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ejercicio_id TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  metricas JSONB NOT NULL DEFAULT '{}'::jsonb,
  completado BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_resultados_ejercicios_user ON public.resultados_ejercicios_concentracion(user_id);
CREATE INDEX idx_resultados_ejercicios_ejer ON public.resultados_ejercicios_concentracion(ejercicio_id);

ALTER TABLE public.resultados_ejercicios_concentracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_resultados_ejercicios_select" ON public.resultados_ejercicios_concentracion
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "own_resultados_ejercicios_insert" ON public.resultados_ejercicios_concentracion
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_resultados_ejercicios_update" ON public.resultados_ejercicios_concentracion
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "admin_all_resultados_ejercicios" ON public.resultados_ejercicios_concentracion
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));