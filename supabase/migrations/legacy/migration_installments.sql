-- migration_installments.sql
-- Agregar columna para permitir abonos a los productos

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS allows_installments BOOLEAN DEFAULT false;
