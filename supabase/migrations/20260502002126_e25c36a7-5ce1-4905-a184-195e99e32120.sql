
-- 1. Reforzar RLS en carreras_favoritas: agregar WITH CHECK al UPDATE
DROP POLICY IF EXISTS own_favoritas_update ON public.carreras_favoritas;
CREATE POLICY own_favoritas_update ON public.carreras_favoritas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Validación de formato/longitud de carrera_id (evita IDs manipulados arbitrariamente largos)
CREATE OR REPLACE FUNCTION public.validate_carrera_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.carrera_id IS NULL OR length(NEW.carrera_id) = 0 OR length(NEW.carrera_id) > 80 THEN
    RAISE EXCEPTION 'carrera_id inválido';
  END IF;
  IF NEW.carrera_id !~ '^[a-z0-9_-]+$' THEN
    RAISE EXCEPTION 'carrera_id contiene caracteres no permitidos';
  END IF;
  IF NEW.notas IS NOT NULL AND length(NEW.notas) > 500 THEN
    RAISE EXCEPTION 'notas demasiado largas (máx 500)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_favoritas ON public.carreras_favoritas;
CREATE TRIGGER trg_validate_favoritas
  BEFORE INSERT OR UPDATE ON public.carreras_favoritas
  FOR EACH ROW EXECUTE FUNCTION public.validate_carrera_id();

-- 3. Reforzar profiles UPDATE con WITH CHECK para que el id no se altere
DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;
CREATE POLICY users_update_own_profile ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Tabla historial_comparaciones
CREATE TABLE public.historial_comparaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  carrera_ids text[] NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_historial_comp_user_fecha
  ON public.historial_comparaciones(user_id, fecha DESC);

ALTER TABLE public.historial_comparaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_historial_select ON public.historial_comparaciones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY own_historial_insert ON public.historial_comparaciones
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY own_historial_delete ON public.historial_comparaciones
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY admin_all_historial ON public.historial_comparaciones
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Validación de historial: máx 3 carreras, IDs con formato válido
CREATE OR REPLACE FUNCTION public.validate_historial_comparacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cid text;
BEGIN
  IF array_length(NEW.carrera_ids, 1) IS NULL OR array_length(NEW.carrera_ids, 1) < 1 OR array_length(NEW.carrera_ids, 1) > 3 THEN
    RAISE EXCEPTION 'Historial debe tener 1 a 3 carreras';
  END IF;
  FOREACH cid IN ARRAY NEW.carrera_ids LOOP
    IF cid IS NULL OR length(cid) = 0 OR length(cid) > 80 OR cid !~ '^[a-z0-9_-]+$' THEN
      RAISE EXCEPTION 'carrera_id inválido en historial: %', cid;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_historial
  BEFORE INSERT OR UPDATE ON public.historial_comparaciones
  FOR EACH ROW EXECUTE FUNCTION public.validate_historial_comparacion();
