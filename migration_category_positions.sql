-- ==========================================
-- Migración: Posiciones Dinámicas por Categoría
-- ==========================================

-- 1. Agregar columna positions como JSONB si no existe
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;

-- 2. Precargar posiciones de Kickingball en las categorías correspondientes
UPDATE public.categories 
SET positions = '[
  {"code": "P", "name": "Pitcher"},
  {"code": "C", "name": "Catcher"},
  {"code": "1B", "name": "Primera Base"},
  {"code": "2B", "name": "Segunda Base"},
  {"code": "3B", "name": "Tercera Base"},
  {"code": "SS", "name": "Shortstop"},
  {"code": "SF", "name": "Short Field"},
  {"code": "LF", "name": "Left Field"},
  {"code": "LCF", "name": "Left Center"},
  {"code": "CF", "name": "Center Field"},
  {"code": "2F", "name": "Second Field"},
  {"code": "RCF", "name": "Right Center"},
  {"code": "RF", "name": "Right Field"}
]'::jsonb
WHERE name ILIKE '%kickingball%' 
   OR name IN ('Infantil', 'Pre-Junior', 'Junior', 'Libre', 'Master', 'Master B', 'Iniciación', 'Semillero');

-- 3. Precargar posiciones de Fútbol en las categorías de Fútbol
UPDATE public.categories 
SET positions = '[
  {"code": "POR", "name": "Portero"},
  {"code": "DFC", "name": "Defensa Central"},
  {"code": "LD", "name": "Lateral Derecho"},
  {"code": "LI", "name": "Lateral Izquierdo"},
  {"code": "MCD", "name": "Mediocampista Defensivo"},
  {"code": "MC", "name": "Mediocampista Central"},
  {"code": "MCO", "name": "Mediocampista Ofensivo"},
  {"code": "ED", "name": "Extremo Derecho"},
  {"code": "EI", "name": "Extremo Izquierdo"},
  {"code": "DC", "name": "Delantero Centro"}
]'::jsonb
WHERE name ILIKE '%fútbol%' OR name ILIKE '%futbol%';
