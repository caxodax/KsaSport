-- ============================================================
-- Migración: Foto de Perfil (avatar_url) para Staff Técnico
-- ============================================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;
