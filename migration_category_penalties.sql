-- ========================================================
-- Migración: Días de Gracia y Penalidades por Categoría
-- ========================================================

-- 1. Añadir columnas de morosidad personalizable por categoría
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS grace_period_days INT DEFAULT NULL;

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(10,2) DEFAULT NULL;

-- Comentario: 
-- Si grace_period_days o penalty_amount son NULL, 
-- la aplicación heredará automáticamente la regla global de club_settings.
