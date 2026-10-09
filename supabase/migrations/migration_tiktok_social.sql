-- ==============================================================================
-- Migración: Añadir TikTok a Redes Sociales Oficiales de KsaSport (club_settings)
-- ==============================================================================

ALTER TABLE public.club_settings 
ADD COLUMN IF NOT EXISTS tiktok_url TEXT DEFAULT '';

COMMENT ON COLUMN public.club_settings.tiktok_url IS 'Enlace de perfil oficial de TikTok de KsaSport (ej: https://tiktok.com/@kasasports)';

-- Garantizar permisos de lectura pública (para visitantes sin login en Footer y Landing)
GRANT SELECT ON public.club_settings TO anon, authenticated;
