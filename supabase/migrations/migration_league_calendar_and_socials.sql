-- ==============================================================================
-- Migración: Redes Sociales, WhatsApp y Calendario de Ligas Activas (Punto 4.2)
-- ==============================================================================

ALTER TABLE public.club_settings 
ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS calendar_title TEXT DEFAULT 'Calendario Oficial de Ligas Activas',
ADD COLUMN IF NOT EXISTS calendar_description TEXT DEFAULT 'Consulta las jornadas, horarios y fixture oficial de nuestros torneos en curso.',
ADD COLUMN IF NOT EXISTS calendar_season TEXT DEFAULT 'Temporada 2026',
ADD COLUMN IF NOT EXISTS calendar_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS calendar_pdf_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS calendar_is_active BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.club_settings.instagram_url IS 'Enlace de perfil de Instagram oficial';
COMMENT ON COLUMN public.club_settings.facebook_url IS 'Enlace de página de Facebook oficial';
COMMENT ON COLUMN public.club_settings.whatsapp_number IS 'Número de WhatsApp oficial para consultas y tryouts (ej: 584128505629)';
COMMENT ON COLUMN public.club_settings.calendar_images IS 'Lista de URLs de afiches o imágenes del rol de juegos';
COMMENT ON COLUMN public.club_settings.calendar_pdf_url IS 'URL del archivo PDF oficial descargable del calendario';
COMMENT ON COLUMN public.club_settings.calendar_is_active IS 'Indica si el calendario público está publicado y visible';

-- Garantizar permisos de lectura pública (espectadores sin login en /calendario)
GRANT SELECT ON public.club_settings TO anon, authenticated;
