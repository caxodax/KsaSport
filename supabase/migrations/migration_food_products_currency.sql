-- ==============================================================================
-- Migración: Moneda por Producto en Cantina (Por defecto EUR)
-- ==============================================================================

-- 1. Agregar columna de moneda al catálogo de productos de cantina
ALTER TABLE public.food_products 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

COMMENT ON COLUMN public.food_products.currency IS 'Moneda base del producto de cantina: EUR, USD, USDT';

-- 2. Agregar columna de moneda a los ítems de órdenes de cantina (auditoría)
ALTER TABLE public.food_order_items
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

COMMENT ON COLUMN public.food_order_items.currency IS 'Moneda en la que se vendió el ítem: EUR, USD, USDT';

-- 3. Agregar columna de moneda a las cuentas de crédito de cantina
ALTER TABLE public.food_credit_accounts
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'EUR';

COMMENT ON COLUMN public.food_credit_accounts.currency IS 'Moneda en la que se expresa el saldo y límite de crédito: EUR';

-- 4. Actualizar registros existentes a 'EUR'
UPDATE public.food_products 
SET currency = 'EUR' 
WHERE currency IS NULL;

UPDATE public.food_order_items 
SET currency = 'EUR' 
WHERE currency IS NULL;

UPDATE public.food_credit_accounts 
SET currency = 'EUR' 
WHERE currency IS NULL;

