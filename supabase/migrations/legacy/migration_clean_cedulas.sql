-- ==========================================
-- Migración: Normalizar Cédulas de Identidad
-- ==========================================
-- Remueve cualquier punto u otros caracteres no numéricos de las tablas athletes y staff.
-- Garantiza que todas las cédulas se almacenen de forma uniforme como dígitos limpios.

UPDATE athletes 
SET cedula = REGEXP_REPLACE(cedula, '[^0-9]', '', 'g')
WHERE cedula LIKE '%.%' OR cedula LIKE '%-%' OR cedula LIKE '% %';

UPDATE staff 
SET cedula = REGEXP_REPLACE(cedula, '[^0-9]', '', 'g')
WHERE cedula LIKE '%.%' OR cedula LIKE '%-%' OR cedula LIKE '% %';

