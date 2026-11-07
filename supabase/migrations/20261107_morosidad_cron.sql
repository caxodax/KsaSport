-- ==============================================================================
-- Migración: Automatización de Morosidad por Días (Hora Oficial de Venezuela)
-- ==============================================================================
-- 1. Función para actualizar masivamente atletas a Solvente o Moroso
-- 2. Programación con pg_cron en la madrugada (00:05 AM hora Venezuela = 04:05 UTC)
-- ==============================================================================

-- 1. Habilitar pg_cron si no está activo
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Procedimiento Almacenado Principal
CREATE OR REPLACE FUNCTION fn_actualizar_morosidad_diaria()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_default_grace INT := 5;
    v_now_vzla TIMESTAMP;
    v_rec RECORD;
    v_to_moroso_count INT := 0;
    v_to_solvente_count INT := 0;
    v_to_moroso_names TEXT[] := '{}';
    v_to_solvente_names TEXT[] := '{}';
    v_eff_grace INT;
    v_deadline TIMESTAMP;
    v_is_expired BOOLEAN;
    v_next_month_date DATE;
    v_p_year INT;
    v_p_month INT;
    v_max_days_in_month INT;
    v_cutoff_day INT;
BEGIN
    -- Fecha y hora exacta actual en Venezuela (America/Caracas, UTC-4 fijo)
    v_now_vzla := (NOW() AT TIME ZONE 'America/Caracas');

    -- Obtener política global de días de corte/gracia
    SELECT COALESCE(grace_period_days, 5) INTO v_default_grace 
    FROM club_settings 
    WHERE id = 1;

    IF v_default_grace IS NULL OR v_default_grace < 1 THEN
        v_default_grace := 5;
    END IF;

    -- Iterar sobre atletas activas (Solvente o Moroso, excluyendo alianzas)
    FOR v_rec IN 
        SELECT 
            a.id, 
            a.name, 
            a.status, 
            a.paid_until,
            c.grace_period_days AS cat_grace_days
        FROM athletes a
        LEFT JOIN teams t ON a.team_id = t.id
        LEFT JOIN categories c ON LOWER(TRIM(c.name)) = LOWER(TRIM(t.category))
        WHERE a.status IN ('Solvente', 'Moroso')
          AND (a.has_alliance IS NULL OR a.has_alliance = false)
    LOOP
        v_is_expired := false;

        IF v_rec.paid_until IS NULL THEN
            -- Sin registro de pago previo -> Moroso inmediato
            v_is_expired := true;
        ELSE
            -- Extraer año y mes del último mes solvente cubierto
            v_p_year := EXTRACT(YEAR FROM v_rec.paid_until)::int;
            v_p_month := EXTRACT(MONTH FROM v_rec.paid_until)::int;

            -- Día de corte aplicable (específico de la categoría o global)
            v_eff_grace := COALESCE(v_rec.cat_grace_days, v_default_grace);
            IF v_eff_grace < 1 THEN
                v_eff_grace := 1;
            END IF;

            -- El mes a evaluar es el mes inmediatamente posterior al solvente
            v_next_month_date := (make_date(v_p_year, v_p_month, 1) + interval '1 month')::date;
            
            -- Días reales que tiene el mes siguiente (evita errores con 28/29 de Feb, 30 días, etc.)
            v_max_days_in_month := EXTRACT(DAY FROM (date_trunc('month', v_next_month_date) + interval '1 month - 1 day'))::int;
            v_cutoff_day := LEAST(v_eff_grace, v_max_days_in_month);

            -- Fecha y hora límite en Venezuela:
            -- Ej: Si v_eff_grace es 6, el corte es el día 6 a las 00:00:00.
            -- A partir del minuto 00:00:01 del día 6, v_now_vzla >= v_deadline -> es Moroso.
            v_deadline := make_timestamp(
                EXTRACT(YEAR FROM v_next_month_date)::int,
                EXTRACT(MONTH FROM v_next_month_date)::int,
                v_cutoff_day,
                0, 0, 0
            );

            IF v_now_vzla >= v_deadline THEN
                v_is_expired := true;
            END IF;
        END IF;

        -- 1. Si expiró y estaba Solvente -> Pasar a Moroso
        IF v_is_expired AND v_rec.status = 'Solvente' THEN
            UPDATE athletes 
            SET status = 'Moroso' 
            WHERE id = v_rec.id;

            v_to_moroso_count := v_to_moroso_count + 1;
            v_to_moroso_names := array_append(v_to_moroso_names, v_rec.name);

        -- 2. Si no ha expirado (o ya pagó) y estaba Moroso -> Restaurar a Solvente
        ELSIF NOT v_is_expired AND v_rec.status = 'Moroso' THEN
            UPDATE athletes 
            SET status = 'Solvente' 
            WHERE id = v_rec.id;

            v_to_solvente_count := v_to_solvente_count + 1;
            v_to_solvente_names := array_append(v_to_solvente_names, v_rec.name);
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'executed_at_vzla', to_char(v_now_vzla, 'YYYY-MM-DD HH24:MI:SS'),
        'updated_to_moroso_count', v_to_moroso_count,
        'updated_to_solvente_count', v_to_solvente_count,
        'athletes_to_moroso', v_to_moroso_names,
        'athletes_to_solvente', v_to_solvente_names
    );
END;
$$;

-- 3. Programación en pg_cron para la madrugada
-- 00:05 AM hora Venezuela = 04:05 AM UTC
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'actualizar_morosidad_diaria_vzla') THEN
        PERFORM cron.unschedule('actualizar_morosidad_diaria_vzla');
    END IF;
END $$;

SELECT cron.schedule(
    'actualizar_morosidad_diaria_vzla',
    '5 4 * * *',
    $$ SELECT fn_actualizar_morosidad_diaria(); $$
);

-- Comentario para ejecución manual inmediata de prueba:
-- SELECT fn_actualizar_morosidad_diaria();
