-- ==============================================================================
-- Migración: Añadir Tryouts y Drafts de Kickingball autoadministrables
-- Tabla: public.club_settings
-- ==============================================================================

ALTER TABLE public.club_settings 
-- Scouting y Tryouts
ADD COLUMN IF NOT EXISTS tryouts_title TEXT DEFAULT 'Scouting y Tryouts Oficiales',
ADD COLUMN IF NOT EXISTS tryouts_season TEXT DEFAULT 'Temporada 2026',
ADD COLUMN IF NOT EXISTS tryouts_description TEXT DEFAULT '¿Tienes talento para el Béisbol o Kickingball? Regístrate en nuestras próximas pruebas y forma parte de nuestros equipos en competencia oficial.',
ADD COLUMN IF NOT EXISTS tryouts_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tryouts_pdf_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tryouts_is_active BOOLEAN DEFAULT TRUE,

-- Drafts de Kickingball
ADD COLUMN IF NOT EXISTS drafts_title TEXT DEFAULT 'Drafts de Kickingball',
ADD COLUMN IF NOT EXISTS drafts_season TEXT DEFAULT 'Temporada 2026',
ADD COLUMN IF NOT EXISTS drafts_description TEXT DEFAULT 'Postulación y selección oficial de atletas para el circuito élite y categorías competitivas de Kickingball.',
ADD COLUMN IF NOT EXISTS drafts_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS drafts_pdf_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS drafts_is_active BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.club_settings.tryouts_title IS 'Título de la tarjeta de Scouting y Tryouts';
COMMENT ON COLUMN public.club_settings.tryouts_images IS 'Lista de URLs de afiches o fotos de convocatorias de tryouts';
COMMENT ON COLUMN public.club_settings.tryouts_pdf_url IS 'URL del PDF oficial descargable de tryouts';
COMMENT ON COLUMN public.club_settings.tryouts_is_active IS 'Indica si la tarjeta de tryouts está publicada en la landing';

COMMENT ON COLUMN public.club_settings.drafts_title IS 'Título de la tarjeta de Drafts de Kickingball';
COMMENT ON COLUMN public.club_settings.drafts_images IS 'Lista de URLs de afiches o fotos del rol de drafts';
COMMENT ON COLUMN public.club_settings.drafts_pdf_url IS 'URL del PDF oficial descargable de drafts';
COMMENT ON COLUMN public.club_settings.drafts_is_active IS 'Indica si la tarjeta de drafts está publicada en la landing';

-- Permisos de lectura pública
GRANT SELECT ON public.club_settings TO anon, authenticated;
