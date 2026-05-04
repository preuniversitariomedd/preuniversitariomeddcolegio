
-- ============================================================
-- 1) profiles: restringir a authenticated
-- ============================================================
DROP POLICY IF EXISTS admin_all_profiles ON public.profiles;
DROP POLICY IF EXISTS users_read_own_profile ON public.profiles;
DROP POLICY IF EXISTS users_update_own_profile ON public.profiles;

CREATE POLICY admin_all_profiles ON public.profiles
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY users_read_own_profile ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY users_update_own_profile ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2) user_roles: bloquear inserciones/updates/deletes de no-admin
-- ============================================================
DROP POLICY IF EXISTS admin_all_roles ON public.user_roles;
DROP POLICY IF EXISTS users_read_own_role ON public.user_roles;

CREATE POLICY users_read_own_role ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY admin_select_roles ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY admin_insert_roles ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY admin_update_roles ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY admin_delete_roles ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Política RESTRICTIVA: nadie puede insertar/actualizar a sí mismo como admin (defensa en profundidad)
CREATE POLICY no_self_role_escalation ON public.user_roles
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

-- ============================================================
-- 3) grupo_miembros: política de lectura propia
-- ============================================================
CREATE POLICY own_grupo_miembros_select ON public.grupo_miembros
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 4) competencias: restringir lectura a participantes/creador/admin
-- ============================================================
DROP POLICY IF EXISTS read_competencias ON public.competencias;

CREATE POLICY read_competencias ON public.competencias
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.competencia_participantes cp
      WHERE cp.competencia_id = competencias.id AND cp.user_id = auth.uid()
    )
  );

-- Función de lookup por código (SECURITY DEFINER) para que estudiantes puedan unirse con código sin leer toda la tabla
CREATE OR REPLACE FUNCTION public.buscar_competencia_por_codigo(_codigo text)
RETURNS TABLE (id uuid, titulo text, estado varchar, codigo varchar)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, titulo, estado, codigo
  FROM public.competencias
  WHERE codigo = upper(trim(_codigo))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.buscar_competencia_por_codigo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_competencia_por_codigo(text) TO authenticated;

-- ============================================================
-- 5) Storage: biblioteca y contenido — requerir inscripción/admin
-- ============================================================
DROP POLICY IF EXISTS biblioteca_auth_read ON storage.objects;
DROP POLICY IF EXISTS contenido_enrolled_read ON storage.objects;

CREATE POLICY biblioteca_enrolled_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'biblioteca'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.inscripciones i WHERE i.user_id = auth.uid())
    )
  );

CREATE POLICY contenido_enrolled_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contenido'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.inscripciones i WHERE i.user_id = auth.uid())
    )
  );

-- ============================================================
-- 6) Funciones SECURITY DEFINER: revocar de anon
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_enrolled(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_enrolled(uuid, uuid) TO authenticated;
