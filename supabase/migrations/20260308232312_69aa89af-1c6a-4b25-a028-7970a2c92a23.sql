
-- Tabla de grupos de estudiantes
CREATE TABLE public.grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar NOT NULL,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_grupos" ON public.grupos FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Tabla de miembros de grupos (un estudiante puede estar en varios grupos)
CREATE TABLE public.grupo_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(grupo_id, user_id)
);

ALTER TABLE public.grupo_miembros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_grupo_miembros" ON public.grupo_miembros FOR ALL USING (has_role(auth.uid(), 'admin'));
