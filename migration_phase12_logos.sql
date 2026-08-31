-- ==========================================
-- Migración: Añadir campo de logo a equipos
-- ==========================================

-- Añadir logo_url a la tabla de equipos para manejar las imágenes subidas
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
