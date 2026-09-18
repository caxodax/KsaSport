-- ==========================================
-- Migración: Añadir estadísticas de Carreras Impulsadas y Anotadas
-- ==========================================

-- Añadir métricas de Carreras Impulsadas (CI) y Carreras Anotadas (CA) a las atletas
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS stats_rbi INTEGER, -- Carreras Impulsadas (Runs Batted In)
ADD COLUMN IF NOT EXISTS stats_runs INTEGER; -- Carreras Anotadas (Runs)
