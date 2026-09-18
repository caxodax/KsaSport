-- ==============================================================================
-- Migración: Histórico de Tasas Oficiales, Moneda por Producto y Control Cambiario
-- ==============================================================================

-- 1. Nueva tabla para el histórico de tasas oficiales diarias (BCV / DolarApi / Manual)
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_rate DATE NOT NULL,
  currency VARCHAR(10) NOT NULL,          -- 'USD' o 'EUR'
  rate NUMERIC(14, 4) NOT NULL,           -- Ej: 842.2067
  source VARCHAR(20) DEFAULT 'bcv',       -- 'bcv', 'dolarapi', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date_rate, currency)             -- Garantiza un solo registro oficial por día y moneda
);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_date ON exchange_rate_history(date_rate DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_currency ON exchange_rate_history(currency, date_rate DESC);

COMMENT ON TABLE exchange_rate_history IS 'Registro histórico de tasas oficiales por día con fuente verificada';
COMMENT ON COLUMN exchange_rate_history.date_rate IS 'Fecha del día correspondiente a la tasa (YYYY-MM-DD)';
COMMENT ON COLUMN exchange_rate_history.currency IS 'Moneda a la que aplica la tasa (USD o EUR)';
COMMENT ON COLUMN exchange_rate_history.rate IS 'Valor de la tasa en Bolívares (Bs/divisa)';
COMMENT ON COLUMN exchange_rate_history.source IS 'Origen de la tasa: bcv, dolarapi, manual';

-- 2. Moneda base / Tipo de tasa en el catálogo de productos
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rate_type VARCHAR(10) DEFAULT 'USD';

COMMENT ON COLUMN products.rate_type IS 'Tipo de tasa/moneda de referencia del producto: USD, EUR, USDT';

-- 3. Campos de control cambiario en el registro de pagos
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS rate_type VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(14, 4) DEFAULT 1.0000,
ADD COLUMN IF NOT EXISTS transferred_amount NUMERIC(14, 2),
ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS date_rate DATE;

COMMENT ON COLUMN payments.rate_type IS 'Moneda base del producto cobrado (USD, EUR, USDT)';
COMMENT ON COLUMN payments.exchange_rate IS 'Tasa oficial BCV aplicada en la transacción';
COMMENT ON COLUMN payments.transferred_amount IS 'Monto exacto transferido en moneda real (Bs, EUR, USDT)';
COMMENT ON COLUMN payments.payment_currency IS 'Moneda del comprobante de pago (VES, USD, EUR, USDT)';
COMMENT ON COLUMN payments.date_rate IS 'Fecha de la tasa aplicada (enlaza con exchange_rate_history)';

-- 4. Campos de respaldo en club_settings
ALTER TABLE club_settings 
ADD COLUMN IF NOT EXISTS last_bcv_usd NUMERIC(14, 4) DEFAULT 842.2067,
ADD COLUMN IF NOT EXISTS last_bcv_eur NUMERIC(14, 4) DEFAULT 977.8778,
ADD COLUMN IF NOT EXISTS bcv_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Registro inicial para la fecha actual para disponibilidad inmediata
INSERT INTO exchange_rate_history (date_rate, currency, rate, source)
VALUES 
  (CURRENT_DATE, 'USD', 842.2067, 'bcv'),
  (CURRENT_DATE, 'EUR', 977.8778, 'bcv')
ON CONFLICT (date_rate, currency) 
DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source;

