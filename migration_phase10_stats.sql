-- Fase 10: Estadísticas Avanzadas y Orden al Bate

-- 1. Agregar columnas a la tabla athletes
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS stats_hits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stats_off_outs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stats_def_outs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS batting_order INTEGER NULL;

-- Asegurarnos de que las estadisticas no sean null
UPDATE athletes SET stats_hits = 0 WHERE stats_hits IS NULL;
UPDATE athletes SET stats_off_outs = 0 WHERE stats_off_outs IS NULL;
UPDATE athletes SET stats_def_outs = 0 WHERE stats_def_outs IS NULL;

-- 2. Función y Trigger para calcular el stats_avg automáticamente
-- El AVG de beisbol/softbol es Hits / (Hits + Outs Ofensivos)
CREATE OR REPLACE FUNCTION calculate_athlete_avg()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.stats_hits + NEW.stats_off_outs) > 0 THEN
        NEW.stats_avg := ROUND((NEW.stats_hits::numeric / (NEW.stats_hits + NEW.stats_off_outs)::numeric), 3);
    ELSE
        NEW.stats_avg := 0.000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_avg ON athletes;
CREATE TRIGGER trg_calculate_avg
BEFORE INSERT OR UPDATE OF stats_hits, stats_off_outs
ON athletes
FOR EACH ROW
EXECUTE FUNCTION calculate_athlete_avg();

-- Forzar recalculado de las filas existentes (si hay alguna migración manual previa)
UPDATE athletes SET stats_avg = stats_avg;
