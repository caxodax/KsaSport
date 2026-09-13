-- ==============================================================================
-- Migración: Agregar campo usdt_promedio en tablas de control cambiario
-- ==============================================================================

-- 1. Agregar usdt_promedio en club_settings (caché de la tasa activa)
ALTER TABLE public.club_settings 
ADD COLUMN IF NOT EXISTS usdt_promedio NUMERIC(14, 4) DEFAULT 960.0000,
ADD COLUMN IF NOT EXISTS last_usdt_promedio NUMERIC(14, 4) DEFAULT 960.0000;

COMMENT ON COLUMN public.club_settings.usdt_promedio IS 'Tasa promedio de referencia USDT (Binance P2P / Cripto)';
COMMENT ON COLUMN public.club_settings.last_usdt_promedio IS 'Última tasa promedio de referencia USDT registrada';

-- 2. Agregar usdt_promedio en exchange_rate_history (histórico diario de tasas)
ALTER TABLE public.exchange_rate_history 
ADD COLUMN IF NOT EXISTS usdt_promedio NUMERIC(14, 4);

COMMENT ON COLUMN public.exchange_rate_history.usdt_promedio IS 'Tasa promedio de referencia USDT del día de la operación';

-- 3. Agregar usdt_promedio en payments (respaldo del valor USDT al declarar el pago)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS usdt_promedio NUMERIC(14, 4);

COMMENT ON COLUMN public.payments.usdt_promedio IS 'Tasa promedio USDT al momento de registrar el pago';

-- 4. Actualizar registro inicial en club_settings
UPDATE public.club_settings 
SET 
  usdt_promedio = COALESCE(usdt_promedio, 960.0000),
  last_usdt_promedio = COALESCE(last_usdt_promedio, 960.0000)
WHERE id = 1;
