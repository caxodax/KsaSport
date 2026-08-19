-- ==========================================
-- Migración: Semáforo de Morosidad (Fase 5)
-- ==========================================

-- 1. Crear tabla de configuraciones globales del club
CREATE TABLE IF NOT EXISTS club_settings (
    id INT PRIMARY KEY DEFAULT 1, -- Solo habrá una fila
    grace_period_days INT DEFAULT 5,
    penalty_amount DECIMAL(10,2) DEFAULT 5.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Aseguramos que solo exista la fila con id = 1
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar la configuración por defecto si no existe
INSERT INTO club_settings (id, grace_period_days, penalty_amount)
VALUES (1, 5, 5.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Añadir la columna de solvencia a las atletas
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS paid_until DATE;

-- 3. Inicializar las fechas de las atletas actuales
-- A las solventes les damos hasta el final del mes actual (ej. 31 de Agosto de 2026)
UPDATE athletes 
SET paid_until = (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date
WHERE status = 'Solvente' AND paid_until IS NULL;

-- A las morosas las dejamos vencidas en el mes pasado (ej. 31 de Julio de 2026)
UPDATE athletes 
SET paid_until = (date_trunc('month', CURRENT_DATE) - interval '1 day')::date
WHERE status = 'Moroso' AND paid_until IS NULL;
