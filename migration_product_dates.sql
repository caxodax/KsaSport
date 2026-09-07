-- ==========================================
-- Migración: Fechas de validez en Productos
-- ==========================================

-- 1. Añadir campos start_date y end_date a la tabla products
ALTER TABLE products ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- 2. (Opcional) Inicializar los productos actuales que sean "Mensualidad" 
-- para que no rompan la lógica, asignándoles el mes en curso como rango.
UPDATE products 
SET 
  start_date = date_trunc('month', created_at),
  end_date = (date_trunc('month', created_at) + interval '1 month - 1 second')
WHERE start_date IS NULL;

