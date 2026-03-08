
-- Competition tables
CREATE TABLE public.competencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  codigo varchar(6) NOT NULL UNIQUE,
  estado varchar NOT NULL DEFAULT 'lobby',
  pregunta_actual integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES profiles(id),
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.competencia_preguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia_id uuid NOT NULL REFERENCES competencias(id) ON DELETE CASCADE,
  pregunta text NOT NULL,
  opciones jsonb NOT NULL,
  respuesta_correcta integer NOT NULL,
  orden integer NOT NULL,
  tiempo_limite integer DEFAULT 30,
  imagen_url text,
  explicacion text
);

CREATE TABLE public.competencia_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia_id uuid NOT NULL REFERENCES competencias(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  puntos integer DEFAULT 0,
  racha integer DEFAULT 0,
  powerups jsonb DEFAULT '{"congelar":1,"50_50":1,"x2":1}',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(competencia_id, user_id)
);

CREATE TABLE public.competencia_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia_id uuid NOT NULL REFERENCES competencias(id) ON DELETE CASCADE,
  pregunta_id uuid NOT NULL REFERENCES competencia_preguntas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  respuesta integer,
  correcta boolean NOT NULL,
  tiempo_usado integer,
  puntos_ganados integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencia_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencia_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencia_respuestas ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_all_competencias" ON public.competencias FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_all_comp_preguntas" ON public.competencia_preguntas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_all_comp_participantes" ON public.competencia_participantes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_all_comp_respuestas" ON public.competencia_respuestas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Students can read active competitions
CREATE POLICY "read_competencias" ON public.competencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "read_comp_preguntas" ON public.competencia_preguntas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM competencia_participantes cp WHERE cp.competencia_id = competencia_preguntas.competencia_id AND cp.user_id = auth.uid()));

-- Students can join competitions
CREATE POLICY "join_competencia" ON public.competencia_participantes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "read_comp_participantes" ON public.competencia_participantes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM competencia_participantes cp WHERE cp.competencia_id = competencia_participantes.competencia_id AND cp.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "update_own_participante" ON public.competencia_participantes FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Students can submit answers
CREATE POLICY "insert_comp_respuestas" ON public.competencia_respuestas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "read_comp_respuestas" ON public.competencia_respuestas FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.competencias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competencia_participantes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competencia_respuestas;
