
-- Add grupo column to contenido for collapsible grouping
ALTER TABLE public.contenido ADD COLUMN IF NOT EXISTS grupo varchar DEFAULT NULL;

-- Add archivo_url and archivo_nombre to mensajes for file attachments
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS archivo_url text DEFAULT NULL;
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS archivo_nombre text DEFAULT NULL;
