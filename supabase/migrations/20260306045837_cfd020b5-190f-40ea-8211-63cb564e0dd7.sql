
-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cedula VARCHAR(10) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  avatar_url TEXT,
  password_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROLES
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  rol VARCHAR(20) CHECK (rol IN ('admin', 'estudiante')) DEFAULT 'estudiante',
  activo BOOLEAN DEFAULT TRUE
);

-- CURSOS
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  color VARCHAR(7) DEFAULT '#8B5CF6',
  orden INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

-- SESIONES
CREATE TABLE sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  orden INT NOT NULL,
  estado VARCHAR(20) DEFAULT 'bloqueada' CHECK (estado IN ('bloqueada', 'abierta'))
);

-- PESTAÑAS
CREATE TABLE pestanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES sesiones(id) ON DELETE CASCADE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  orden INT NOT NULL,
  activa BOOLEAN DEFAULT TRUE
);

-- CONTENIDO
CREATE TABLE contenido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pestana_id UUID REFERENCES pestanas(id) ON DELETE CASCADE NOT NULL,
  titulo VARCHAR(200),
  texto TEXT,
  solucion TEXT,
  imagen_url TEXT,
  video_url TEXT,
  orden INT DEFAULT 0
);

-- QUIZ PREGUNTAS
CREATE TABLE quiz_preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID REFERENCES sesiones(id) ON DELETE CASCADE NOT NULL,
  pregunta TEXT NOT NULL,
  imagen_url TEXT,
  opciones JSONB NOT NULL,
  respuesta_correcta INT NOT NULL CHECK (respuesta_correcta BETWEEN 0 AND 3),
  explicacion TEXT,
  tiempo_limite INT DEFAULT 60 CHECK (tiempo_limite BETWEEN 10 AND 300)
);

-- QUIZ RESPUESTAS
CREATE TABLE quiz_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pregunta_id UUID REFERENCES quiz_preguntas(id) ON DELETE CASCADE NOT NULL,
  correcta BOOLEAN NOT NULL,
  tiempo_usado INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROGRESO
CREATE TABLE progreso_estudiante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sesion_id UUID REFERENCES sesiones(id) ON DELETE CASCADE NOT NULL,
  porcentaje INT DEFAULT 0,
  intentos_quiz INT DEFAULT 0,
  preguntas_correctas INT DEFAULT 0,
  tiempo_invertido INT DEFAULT 0,
  UNIQUE(user_id, sesion_id)
);

-- INSCRIPCIONES
CREATE TABLE inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, curso_id)
);

-- BIBLIOTECA
CREATE TABLE biblioteca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) CHECK (tipo IN ('pdf', 'video', 'link', 'imagen', 'documento')) NOT NULL,
  url TEXT NOT NULL,
  curso_id UUID REFERENCES cursos(id),
  categoria VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MENSAJES
CREATE TABLE mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remitente_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  destinatario_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_profiles_cedula ON profiles(cedula);
CREATE INDEX idx_contenido_pestana ON contenido(pestana_id, orden);
CREATE INDEX idx_quiz_sesion ON quiz_preguntas(sesion_id);
CREATE INDEX idx_quiz_resp_user ON quiz_respuestas(user_id, pregunta_id);
CREATE INDEX idx_progreso_user ON progreso_estudiante(user_id);
CREATE INDEX idx_inscripciones_user ON inscripciones(user_id);
CREATE INDEX idx_mensajes_dest ON mensajes(destinatario_id, leido);

-- SECURITY DEFINER FUNCTION FOR ROLE CHECKING
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND rol = _role AND activo = true
  )
$$;

-- CHECK IF USER IS ENROLLED IN A COURSE
CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id uuid, _curso_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.inscripciones
    WHERE user_id = _user_id AND curso_id = _curso_id
  )
$$;

-- RLS: PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: USER_ROLES
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_role" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin_all_roles" ON user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: CURSOS
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrolled_read_cursos" ON cursos FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR public.is_enrolled(auth.uid(), id)
);
CREATE POLICY "admin_all_cursos" ON cursos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: SESIONES
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrolled_read_sesiones" ON sesiones FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR public.is_enrolled(auth.uid(), curso_id)
);
CREATE POLICY "admin_all_sesiones" ON sesiones FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: PESTANAS
ALTER TABLE pestanas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_pestanas" ON pestanas FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM sesiones s
    JOIN inscripciones i ON i.curso_id = s.curso_id
    WHERE s.id = pestanas.sesion_id AND i.user_id = auth.uid()
  )
);
CREATE POLICY "admin_all_pestanas" ON pestanas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: CONTENIDO
ALTER TABLE contenido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_contenido" ON contenido FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM pestanas p
    JOIN sesiones s ON s.id = p.sesion_id
    JOIN inscripciones i ON i.curso_id = s.curso_id
    WHERE p.id = contenido.pestana_id AND i.user_id = auth.uid()
  )
);
CREATE POLICY "admin_all_contenido" ON contenido FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: QUIZ PREGUNTAS
ALTER TABLE quiz_preguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_quiz" ON quiz_preguntas FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM sesiones s
    JOIN inscripciones i ON i.curso_id = s.curso_id
    WHERE s.id = quiz_preguntas.sesion_id AND i.user_id = auth.uid()
  )
);
CREATE POLICY "admin_all_quiz" ON quiz_preguntas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: QUIZ RESPUESTAS
ALTER TABLE quiz_respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_respuestas" ON quiz_respuestas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own_respuestas" ON quiz_respuestas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_all_respuestas" ON quiz_respuestas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: PROGRESO
ALTER TABLE progreso_estudiante ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_progreso" ON progreso_estudiante FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "upsert_own_progreso" ON progreso_estudiante FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_progreso" ON progreso_estudiante FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "admin_all_progreso" ON progreso_estudiante FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: INSCRIPCIONES
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_inscripciones" ON inscripciones FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin_all_inscripciones" ON inscripciones FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: BIBLIOTECA
ALTER TABLE biblioteca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_biblioteca" ON biblioteca FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_biblioteca" ON biblioteca FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: MENSAJES
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_mensajes" ON mensajes FOR SELECT USING (
  remitente_id = auth.uid() OR destinatario_id = auth.uid()
);
CREATE POLICY "insert_mensajes" ON mensajes FOR INSERT WITH CHECK (remitente_id = auth.uid());
CREATE POLICY "update_leido" ON mensajes FOR UPDATE USING (destinatario_id = auth.uid());
CREATE POLICY "admin_all_mensajes" ON mensajes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('contenido', 'contenido', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('biblioteca', 'biblioteca', false);

-- STORAGE POLICIES
CREATE POLICY "avatar_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatar_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "contenido_admin_all" ON storage.objects FOR ALL USING (bucket_id = 'contenido' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "contenido_enrolled_read" ON storage.objects FOR SELECT USING (bucket_id = 'contenido');
CREATE POLICY "biblioteca_admin_all" ON storage.objects FOR ALL USING (bucket_id = 'biblioteca' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "biblioteca_auth_read" ON storage.objects FOR SELECT USING (bucket_id = 'biblioteca');
