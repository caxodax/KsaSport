-- ==========================================
-- Migración: Gestión Deportiva (Fase 7)
-- ==========================================

-- 1. Añadir el user_id a la tabla staff para saber qué Coach está logueado
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

-- 2. Añadir métricas deportivas a las atletas
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS position VARCHAR(50),
ADD COLUMN IF NOT EXISTS stats_avg DECIMAL(4,3); -- Formato de Average (Ej: 0.350)
