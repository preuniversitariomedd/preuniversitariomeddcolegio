
-- Add descripcion column to sesiones table
ALTER TABLE public.sesiones ADD COLUMN IF NOT EXISTS descripcion text;

-- Enable realtime for quiz_respuestas so admin gets notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_respuestas;
