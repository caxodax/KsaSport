-- ==============================================================================
-- Migración: Logotipo Oficial de la Marca KsaSport (Punto 4.3)
-- ==============================================================================

ALTER TABLE public.club_settings 
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT 'https://pub-d9a707e799754eaf97bb7a295f4a8030.r2.dev/branding/ksasport-official-logo.png';

COMMENT ON COLUMN public.club_settings.logo_url IS 'URL del logotipo oficial de la marca KsaSport (permite personalización desde admin)';
